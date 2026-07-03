/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { eventEmitter, MSG } from '@/common';
import { MqttService } from '@/infrastructure/mqtt/mqtt.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeviceService } from './device.service';
import { DeviceUtil } from './device.util';
import { DeviceError } from './entities/device-error.entity';
import { DeviceInfo } from './entities/device-info.entity';
import { Device } from './entities/device.entity';

describe('DeviceService', () => {
  let service: DeviceService;
  let deviceRepo: any;
  let infoRepo: any;
  let errorRepo: any;
  let mqttService: any;
  let redisService: any;
  let deviceUtil: any;

  beforeEach(async () => {
    deviceRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(),
      delete: jest.fn(),
    };
    infoRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(),
    };
    errorRepo = {
      findAndCount: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(),
    };
    mqttService = {
      publishToDevice: jest.fn(),
      createDynamicUser: jest.fn(),
      createQueue: jest.fn(),
      deleteUser: jest.fn(),
      deleteQueue: jest.fn(),
    };
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    deviceUtil = {
      encrypt: jest.fn((value) => `encrypted:${value}`),
      decrypt: jest.fn((value) => `decrypted:${value}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        { provide: getRepositoryToken(Device), useValue: deviceRepo },
        { provide: getRepositoryToken(DeviceInfo), useValue: infoRepo },
        { provide: getRepositoryToken(DeviceError), useValue: errorRepo },
        { provide: MqttService, useValue: mqttService },
        { provide: RedisService, useValue: redisService },
        { provide: DeviceUtil, useValue: deviceUtil },
      ],
    }).compile();

    service = module.get(DeviceService);
  });

  describe('sendMsg', () => {
    it('publishes to the cached owned-device queue and resolves with the device response', async () => {
      redisService.get.mockResolvedValue('machine-1');
      mqttService.publishToDevice.mockResolvedValue(true);
      let responseListener: ((value: boolean) => void) | undefined;
      jest.spyOn(eventEmitter, 'once').mockImplementation((event, listener) => {
        expect(event).toBe('machine-1');
        responseListener = listener as (value: boolean) => void;
        return eventEmitter;
      });

      const result = service.sendMsg(7, {
        deviceId: 10,
        message: { type: MSG.STATUS },
      });

      await new Promise((resolve) => setImmediate(resolve));
      responseListener?.(true);

      expect(mqttService.publishToDevice).toHaveBeenCalledWith(
        'q_device_machine-1',
        { type: MSG.STATUS },
      );
      await expect(result).resolves.toBe(true);
      expect(deviceRepo.findOne).not.toHaveBeenCalled();
    });

    it('throws when the device is owned by another user', async () => {
      redisService.get.mockResolvedValue(null);
      deviceRepo.findOne.mockResolvedValue({
        id: 10,
        machineId: 'machine-1',
        user: { id: 99 },
      });

      await expect(
        service.sendMsg(7, { deviceId: 10, message: { type: MSG.STATUS } }),
      ).rejects.toThrow(BadRequestException);
      expect(mqttService.publishToDevice).not.toHaveBeenCalled();
    });
  });

  describe('getOwnedDevice', () => {
    it('loads the device from DB, caches the machine id, and returns it', async () => {
      redisService.get.mockResolvedValue(null);
      deviceRepo.findOne.mockResolvedValue({
        id: 10,
        machineId: 'machine-1',
        user: { id: 7 },
      });

      await expect(service.getOwnedDevice(7, 10)).resolves.toBe('machine-1');
      expect(redisService.set).toHaveBeenCalledWith(
        'device:10',
        'machine-1',
        120,
      );
    });

    it('throws NotFoundException when the device is missing', async () => {
      redisService.get.mockResolvedValue(null);
      deviceRepo.findOne.mockResolvedValue(null);

      await expect(service.getOwnedDevice(7, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPairToken', () => {
    it('returns an existing per-user pair token from Redis', async () => {
      redisService.get.mockResolvedValue('existing-token');

      await expect(service.getPairToken(7)).resolves.toBe('existing-token');
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('creates and stores a pair token when no token exists', async () => {
      redisService.get.mockResolvedValue(null);

      const token = await service.getPairToken(7);

      expect(token).toHaveLength(64);
      expect(redisService.set).toHaveBeenCalledWith(`pair:${token}`, '7', 120);
      expect(redisService.set).toHaveBeenCalledWith('pair:user:7', token, 120);
    });
  });

  describe('getMqAccount', () => {
    it('creates a RabbitMQ user, queue, and encrypted device info when missing', async () => {
      const dto = { machineId: 'machine-1' };
      deviceRepo.findOne.mockResolvedValue({
        id: 10,
        machineId: 'machine-1',
        info: null,
      });
      mqttService.createDynamicUser.mockResolvedValue({
        username: 'mq-user',
        password: 'mq-pass',
      });

      await expect(service.getMqAccount(dto)).resolves.toEqual({
        username: 'mq-user',
        password: 'mq-pass',
      });
      expect(mqttService.createDynamicUser).toHaveBeenCalledWith('machine-1');
      expect(mqttService.createQueue).toHaveBeenCalledWith(
        'q_device_machine-1',
      );
      expect(infoRepo.create).toHaveBeenCalledWith({
        deviceId: 10,
        userId: 'mq-user',
        pw: 'encrypted:mq-pass',
      });
      expect(infoRepo.save).toHaveBeenCalledWith({
        deviceId: 10,
        userId: 'mq-user',
        pw: 'encrypted:mq-pass',
      });
    });

    it('decrypts and returns an existing RabbitMQ account', async () => {
      const dto = { machineId: 'machine-1' };
      deviceRepo.findOne.mockResolvedValue({
        id: 10,
        machineId: 'machine-1',
        info: { userId: 'mq-user', pw: 'ciphertext' },
      });

      await expect(service.getMqAccount(dto)).resolves.toEqual({
        username: 'mq-user',
        password: 'decrypted:ciphertext',
      });
      expect(mqttService.createDynamicUser).not.toHaveBeenCalled();
    });

    it('throws when the device is missing', async () => {
      deviceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getMqAccount({ machineId: 'machine-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDevice', () => {
    it('sends delete command, removes MQ resources, and deletes the row', async () => {
      deviceRepo.findOne.mockResolvedValue({
        id: 10,
        machineId: 'machine-1',
        info: { userId: 'mq-user' },
      });

      await expect(service.deleteDevice(10)).resolves.toBe(true);
      expect(mqttService.publishToDevice).toHaveBeenCalledWith(
        'q_device_machine-1',
        { type: MSG.DELETE },
      );
      expect(mqttService.deleteUser).toHaveBeenCalledWith('mq-user');
      expect(mqttService.deleteQueue).toHaveBeenCalledWith(
        'q_device_machine-1',
      );
      expect(deviceRepo.delete).toHaveBeenCalledWith({ id: 10 });
    });

    it('throws when deleting a missing device', async () => {
      deviceRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteDevice(10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('pairDevice', () => {
    it('creates a new device and clears pair-token cache', async () => {
      redisService.get.mockResolvedValue('7');
      deviceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.pairDevice({
          machineId: 'machine-1',
          name: 'Office PC',
          description: 'Desk',
          token: 'pair-token',
        }),
      ).resolves.toBe(true);

      expect(deviceRepo.create).toHaveBeenCalledWith({
        machineId: 'machine-1',
        name: 'Office PC',
        description: 'Desk',
        user: { id: 7 },
      });
      expect(deviceRepo.save).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalledWith('pair:pair-token');
      expect(redisService.del).toHaveBeenCalledWith('pair:user:7');
    });

    it('throws when the pair token is missing or expired', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(
        service.pairDevice({
          machineId: 'machine-1',
          name: 'Office PC',
          token: 'missing-token',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the device is already owned by another user', async () => {
      redisService.get.mockResolvedValue('7');
      deviceRepo.findOne.mockResolvedValue({ user: { id: 99 } });

      await expect(
        service.pairDevice({
          machineId: 'machine-1',
          name: 'Office PC',
          token: 'pair-token',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('wraps repository save failures in BadRequestException', async () => {
      redisService.get.mockResolvedValue('7');
      deviceRepo.findOne.mockResolvedValue(null);
      deviceRepo.save.mockRejectedValue(new Error('db down'));

      await expect(
        service.pairDevice({
          machineId: 'machine-1',
          name: 'Office PC',
          token: 'pair-token',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('queries and errors', () => {
    it('returns paginated device rows', async () => {
      const list = [{ id: 10, name: 'Office PC', description: 'Desk' }];
      deviceRepo.findAndCount.mockResolvedValue([list, 1]);

      await expect(
        service.getDevices(7, { page: 1, limit: 10 }),
      ).resolves.toEqual({ list, total: 1 });
      expect(deviceRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { id: 7 } } }),
      );
    });

    it('saves device errors using a cached machine lookup', async () => {
      redisService.get.mockResolvedValue('10');

      await expect(
        service.sendError({
          machineId: 'machine-1',
          code: 500,
          message: 'Overheat',
        }),
      ).resolves.toBe(true);
      expect(errorRepo.create).toHaveBeenCalledWith({
        code: 500,
        message: 'Overheat',
        device: { id: 10 },
      });
      expect(errorRepo.save).toHaveBeenCalled();
    });

    it('throws when sending an error for an unknown machine id', async () => {
      redisService.get.mockResolvedValue(null);
      deviceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendError({
          machineId: 'machine-1',
          code: 500,
          message: 'Overheat',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
