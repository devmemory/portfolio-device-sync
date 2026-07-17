/* eslint-disable @typescript-eslint/unbound-method */
import { JwtGuard, LocalPCGuard } from '@/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import {
  DeviceErrPageDto,
  MachineIdDto,
  PairDeviceDto,
  SendErrDto,
  SendMsgDto,
} from './device.dto';
import { DeviceService } from './device.service';

describe('DeviceController', () => {
  let controller: DeviceController;
  let service: DeviceService;

  const mockDeviceService = {
    sendMsg: jest.fn(),
    getDevices: jest.fn(),
    getErrors: jest.fn(),
    getPairToken: jest.fn(),
    deleteDevice: jest.fn(),
    pairDevice: jest.fn(),
    getStatus: jest.fn(),
    getMqAccount: jest.fn(),
    sendError: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [{ provide: DeviceService, useValue: mockDeviceService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(LocalPCGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DeviceController>(DeviceController);
    service = module.get<DeviceService>(DeviceService);
  });

  describe('success case', () => {
    it('sendMsg: should delegate user id and message dto', async () => {
      const dto: SendMsgDto = {
        deviceId: 10,
        message: { type: 'STATUS' },
      };
      mockDeviceService.sendMsg.mockResolvedValue(true);

      await expect(controller.sendMsg(7, dto)).resolves.toBe(true);
      expect(service.sendMsg).toHaveBeenCalledWith(7, dto);
    });

    it('getDevices: should delegate pagination query with user id', async () => {
      const query = { page: 1, limit: 10 };
      const expected = {
        list: [{ id: 10, name: 'Office PC', description: 'Desk' }],
        total: 1,
      };
      mockDeviceService.getDevices.mockResolvedValue(expected);

      await expect(controller.getDevices(7, query)).resolves.toEqual(expected);
      expect(service.getDevices).toHaveBeenCalledWith(7, query);
    });

    it('getErrors: should delegate error pagination query with user id', async () => {
      const query: DeviceErrPageDto = { page: 1, limit: 10, deviceId: 10 };
      const expected = {
        list: [{ id: 1, code: 500, message: 'Overheat' }],
        total: 1,
      };
      mockDeviceService.getErrors.mockResolvedValue(expected);

      await expect(controller.getErrors(7, query)).resolves.toEqual(expected);
      expect(service.getErrors).toHaveBeenCalledWith(7, query);
    });

    it('getPairToken: should return a pair token for the current user', async () => {
      mockDeviceService.getPairToken.mockResolvedValue('pair-token');

      await expect(controller.getPairToken(7)).resolves.toBe('pair-token');
      expect(service.getPairToken).toHaveBeenCalledWith(7);
    });

    it('deleteDevice: should delete by dto.deviceId', async () => {
      mockDeviceService.deleteDevice.mockResolvedValue(true);

      await expect(controller.deleteDevice({ deviceId: 10 })).resolves.toBe(
        true,
      );
      expect(service.deleteDevice).toHaveBeenCalledWith(10);
    });

    it('pairDevice: should delegate local device pairing dto', async () => {
      const dto: PairDeviceDto = {
        machineId: 'machine-1',
        token: 'pair-token',
        name: 'Office PC',
        description: 'Desk',
      };
      mockDeviceService.pairDevice.mockResolvedValue(true);

      await expect(controller.pairDevice(dto)).resolves.toBe(true);
      expect(service.pairDevice).toHaveBeenCalledWith(dto);
    });

    it('getStatus: should delegate machine id and return ownership status', async () => {
      const dto: MachineIdDto = { machineId: 'machine-1' };
      mockDeviceService.getStatus.mockResolvedValue(false);

      await expect(controller.getStatus(dto)).resolves.toBe(false);
      expect(service.getStatus).toHaveBeenCalledWith('machine-1');
    });

    it('getMqAccount: should return AMQP account credentials', async () => {
      const dto: MachineIdDto = { machineId: 'machine-1' };
      const expected = { username: 'mq-user', password: 'mq-pass' };
      mockDeviceService.getMqAccount.mockResolvedValue(expected);

      await expect(controller.getMqAccount(dto)).resolves.toEqual(expected);
      expect(service.getMqAccount).toHaveBeenCalledWith(dto);
    });

    it('sendError: should persist a reported device error', async () => {
      const dto: SendErrDto = {
        machineId: 'machine-1',
        code: 500,
        message: 'Overheat',
      };
      mockDeviceService.sendError.mockResolvedValue(true);

      await expect(controller.sendError(dto)).resolves.toBe(true);
      expect(service.sendError).toHaveBeenCalledWith(dto);
    });
  });

  describe('failure case', () => {
    it('sendMsg: should propagate NotFoundException from service', async () => {
      const dto: SendMsgDto = {
        deviceId: 10,
        message: { type: 'STATUS' },
      };
      mockDeviceService.sendMsg.mockRejectedValue(
        new NotFoundException('Device not found'),
      );

      await expect(controller.sendMsg(7, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('pairDevice: should propagate BadRequestException for conflicting ownership', async () => {
      const dto: PairDeviceDto = {
        machineId: 'machine-1',
        token: 'pair-token',
        name: 'Office PC',
      };
      mockDeviceService.pairDevice.mockRejectedValue(
        new BadRequestException('Device already belongs to another user'),
      );

      await expect(controller.pairDevice(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('getMqAccount: should propagate NotFoundException for unknown machines', async () => {
      mockDeviceService.getMqAccount.mockRejectedValue(
        new NotFoundException('Device not found'),
      );

      await expect(
        controller.getMqAccount({ machineId: 'missing-machine' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
