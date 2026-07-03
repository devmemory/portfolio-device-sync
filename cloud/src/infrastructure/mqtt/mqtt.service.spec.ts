/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { eventEmitter, MSG, REALTIME_EVENT } from '@/common';
import { HttpService } from '@nestjs/axios';
import amqp from 'amqp-connection-manager';
import { of, throwError } from 'rxjs';
import { MqttService } from './mqtt.service';

jest.mock('amqp-connection-manager', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

describe('MqttService', () => {
  let service: MqttService;
  let httpService: any;
  let connection: any;
  let channelWrapper: any;
  let rawChannel: any;

  beforeEach(() => {
    process.env.RABBITMQ_USER = 'admin';
    process.env.RABBITMQ_PW = 'secret';
    process.env.RABBITMQ_HOST = 'rabbit.local';

    rawChannel = {
      assertQueue: jest.fn(),
      prefetch: jest.fn(),
      consume: jest.fn().mockResolvedValue({ consumerTag: 'consumer-1' }),
      ack: jest.fn(),
      nack: jest.fn(),
      cancel: jest.fn(),
      close: jest.fn(),
      deleteQueue: jest.fn(),
    };
    channelWrapper = {
      addSetup: jest.fn(async (setup) => setup(rawChannel)),
      waitForConnect: jest.fn(),
      publish: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
    };
    connection = {
      createChannel: jest.fn(() => channelWrapper),
      close: jest.fn(),
      _currentConnection: {
        createChannel: jest.fn().mockResolvedValue(rawChannel),
      },
    };
    (amqp.connect as jest.Mock).mockReturnValue(connection);

    httpService = {
      put: jest.fn(),
      delete: jest.fn(),
    };
    service = new MqttService(httpService as HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes RabbitMQ connection and asserts the upstream queue', async () => {
    await service.onModuleInit();

    expect(amqp.connect).toHaveBeenCalledWith([
      'amqp://admin:secret@rabbit.local:5672',
    ]);
    expect(connection.createChannel).toHaveBeenCalled();
    expect(rawChannel.assertQueue).toHaveBeenCalledWith('q_global_upstream', {
      durable: true,
      autoDelete: false,
    });
  });

  it('publishes JSON payloads as expiring transient messages', async () => {
    await service.onModuleInit();

    await expect(
      service.publishToDevice('q_device_machine-1', { type: 'STATUS' }),
    ).resolves.toBe(true);
    expect(channelWrapper.publish).toHaveBeenCalledWith(
      '',
      'q_device_machine-1',
      Buffer.from(JSON.stringify({ type: 'STATUS' })),
      { persistent: false, expiration: 60000 },
    );
  });

  it('consumes valid JSON, acknowledges the message, and calls the handler', async () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    await service.onModuleInit();
    await service.consumeJson();
    const onMessage = rawChannel.consume.mock.calls.at(-1)[1];
    const message = { content: Buffer.from(JSON.stringify({ ok: true })) };

    await onMessage(message);

    expect(rawChannel.prefetch).toHaveBeenCalledWith(1);
    expect(rawChannel.ack).toHaveBeenCalledWith(message);
    expect(emitSpy).toHaveBeenCalledWith(REALTIME_EVENT, { ok: true });
  });

  it('nacks malformed JSON without calling the handler', async () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    await service.onModuleInit();
    await service.consumeJson();
    const onMessage = rawChannel.consume.mock.calls.at(-1)[1];
    const message = { content: Buffer.from('{bad json') };

    await onMessage(message);

    expect(rawChannel.nack).toHaveBeenCalledWith(message, false, false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits CHECK results on the machine-specific event', async () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    await service.onModuleInit();
    await service.consumeJson();
    const onMessage = rawChannel.consume.mock.calls.at(-1)[1];
    const message = {
      content: Buffer.from(
        JSON.stringify({
          type: MSG.CHECK,
          data: { machineId: 'machine-1', result: true },
        }),
      ),
    };

    await onMessage(message);

    expect(rawChannel.ack).toHaveBeenCalledWith(message);
    expect(emitSpy).toHaveBeenCalledWith('machine-1', true);
  });

  it('throws when consuming without an active raw connection', async () => {
    await service.onModuleInit();
    connection._currentConnection = undefined;

    await expect(service.consumeJson()).rejects.toThrow(
      'No active MQ connection',
    );
  });

  it('creates a dynamic RabbitMQ user and permissions through the management API', async () => {
    httpService.put.mockReturnValue(of({ data: {} }));
    await service.onModuleInit();

    const result = await service.createDynamicUser('machine-1');

    expect(result.username).toMatch(/^user_[a-f0-9]{8}$/);
    expect(result.password).toEqual(expect.any(String));
    expect(httpService.put).toHaveBeenCalledTimes(2);
    expect(httpService.put).toHaveBeenCalledWith(
      `http://rabbit.local:15672/api/users/${result.username}`,
      { password: result.password, tags: '' },
      expect.objectContaining({
        auth: { username: 'admin', password: 'secret' },
      }),
    );
    expect(httpService.put).toHaveBeenCalledWith(
      `http://rabbit.local:15672/api/permissions/%2f/${result.username}`,
      {
        configure: '',
        write: '^(amq\\.default|q_device_machine-1)$',
        read: '^(amq\\.default|q_device_machine-1)$',
      },
      expect.objectContaining({
        auth: { username: 'admin', password: 'secret' },
      }),
    );
  });

  it('propagates dynamic-user API failures', async () => {
    httpService.put.mockReturnValueOnce(
      throwError(() => new Error('api down')),
    );
    await service.onModuleInit();

    await expect(service.createDynamicUser('machine-1')).rejects.toThrow(
      'api down',
    );
  });

  it('creates queues using channel setup and waits for connection', async () => {
    await service.onModuleInit();

    await service.createQueue('q_device_machine-1');

    expect(rawChannel.assertQueue).toHaveBeenCalledWith('q_device_machine-1', {
      durable: true,
      autoDelete: false,
    });
    expect(channelWrapper.waitForConnect).toHaveBeenCalled();
  });

  it('deletes queues using a raw channel and closes it', async () => {
    await service.onModuleInit();

    await service.deleteQueue('q_device_machine-1');

    expect(rawChannel.deleteQueue).toHaveBeenCalledWith('q_device_machine-1', {
      ifUnused: false,
      ifEmpty: false,
    });
    expect(rawChannel.close).toHaveBeenCalled();
  });

  it('closes wrapper and connection on module destroy', async () => {
    await service.onModuleInit();

    await service.onModuleDestroy();

    expect(channelWrapper.close).toHaveBeenCalled();
    expect(connection.close).toHaveBeenCalled();
  });
});
