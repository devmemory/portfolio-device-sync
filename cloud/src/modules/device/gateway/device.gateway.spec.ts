/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { MSG } from '@/common';
import { WsException } from '@nestjs/websockets';
import { DeviceGateway } from './device.gateway';

describe('DeviceGateway', () => {
  let gateway: DeviceGateway;
  let deviceRepo: any;
  let mqttService: any;
  let redisService: any;
  let server: any;

  beforeEach(async () => {
    process.env.TURN_SECRET = 'turn-secret';
    process.env.TURN_REALM = 'turn.local';

    deviceRepo = {
      findOne: jest.fn(),
    };
    mqttService = {
      consumeJson: jest.fn(),
      publishToDevice: jest.fn(),
    };
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
    };
    server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    gateway = new DeviceGateway(deviceRepo, mqttService, redisService);
    gateway.server = server;
  });

  it('subscribes to MQTT JSON payloads on module init', () => {
    gateway.onModuleInit();

    expect(mqttService.consumeJson).toHaveBeenCalledWith(expect.any(Function));
  });

  it('joins a room, requests TURN signaling, and publishes close on socket disconnect', async () => {
    redisService.get.mockResolvedValue('q_device_machine-1');
    const client = {
      join: jest.fn(),
    };

    await gateway.handleJoinEvent(7, client as any, { deviceId: 10 });
    gateway.handleDisconnect(client as any);

    expect(client.join).toHaveBeenCalledWith('room-10');
    expect(mqttService.publishToDevice).toHaveBeenCalledWith(
      'q_device_machine-1',
      expect.objectContaining({
        type: MSG.SIGNAL,
        data: expect.objectContaining({
          urls: 'turn:turn.local?transport=udp',
          username: expect.stringMatching(/^\d+:my_users$/),
          credential: expect.any(String),
        }),
      }),
    );
    expect(mqttService.publishToDevice).toHaveBeenCalledWith(
      'q_device_machine-1',
      { type: MSG.CLOSE },
    );
  });

  it('publishes WebRTC offer payloads to the device queue', async () => {
    redisService.get.mockResolvedValue(null);
    deviceRepo.findOne.mockResolvedValue({ id: 10, machineId: 'machine-1' });

    await gateway.handleOffer(7, {
      deviceId: 10,
      sdp: 'offer-sdp',
      type: 'offer',
    });

    expect(redisService.set).toHaveBeenCalledWith(
      'user:7-10',
      'q_device_machine-1',
      3600,
    );
    expect(mqttService.publishToDevice).toHaveBeenCalledWith(
      'q_device_machine-1',
      { type: MSG.OFFER, data: { sdp: 'offer-sdp', type: 'offer' } },
    );
  });

  it('publishes WebRTC candidate payloads to the cached device queue', async () => {
    redisService.get.mockResolvedValue('q_device_machine-1');

    await gateway.handleCandidate(7, {
      deviceId: 10,
      candidate: 'candidate',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });

    expect(mqttService.publishToDevice).toHaveBeenCalledWith(
      'q_device_machine-1',
      {
        type: MSG.CANDIDATE,
        data: { candidate: 'candidate', sdpMid: '0', sdpMLineIndex: 0 },
      },
    );
  });

  it('throws WsException when the requested device is not owned by the user', async () => {
    redisService.get.mockResolvedValue(null);
    deviceRepo.findOne.mockResolvedValue(null);

    await expect(
      gateway.handleOffer(7, {
        deviceId: 10,
        sdp: 'offer-sdp',
        type: 'offer',
      }),
    ).rejects.toThrow(WsException);
    expect(mqttService.publishToDevice).not.toHaveBeenCalled();
  });

  it('emits answer messages from MQTT to the device room', async () => {
    redisService.get.mockResolvedValue(null);
    deviceRepo.findOne.mockResolvedValue({ id: 10, machineId: 'machine-1' });

    await (gateway as any).subscribe({
      type: MSG.ANSWER,
      data: { machineId: 'machine-1', sdp: 'answer-sdp', type: 'answer' },
    });

    expect(server.to).toHaveBeenCalledWith('room-10');
    expect(server.emit).toHaveBeenCalledWith(MSG.ANSWER, {
      sdp: 'answer-sdp',
      type: 'answer',
    });
  });

  it('emits candidate messages from MQTT to the device room', async () => {
    redisService.get.mockResolvedValue('10');

    await (gateway as any).subscribe({
      type: MSG.CANDIDATE,
      data: {
        machineId: 'machine-1',
        candidate: 'candidate',
        sdpMid: '0',
        sdpMLineIndex: 0,
      },
    });

    expect(server.to).toHaveBeenCalledWith('room-10');
    expect(server.emit).toHaveBeenCalledWith(MSG.CANDIDATE, {
      candidate: 'candidate',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });
  });

  it('throws WsException when an MQTT payload references an unknown device', async () => {
    redisService.get.mockResolvedValue(null);
    deviceRepo.findOne.mockResolvedValue(null);

    await expect(
      (gateway as any).subscribe({
        type: MSG.ANSWER,
        data: {
          machineId: 'missing-machine',
          sdp: 'answer-sdp',
          type: 'answer',
        },
      }),
    ).rejects.toThrow(WsException);
  });
});
