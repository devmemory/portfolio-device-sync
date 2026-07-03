import { eventEmitter, getPagination, MSG, PaginationDto } from '@/common';
import { MqttService } from '@/infrastructure/mqtt/mqtt.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import {
  DeviceErrPageDto,
  MachineIdDto,
  PairDeviceDto,
  SendErrDto,
  SendMsgDto,
} from './device.dto';
import { deviceNameUtil, DeviceUtil } from './device.util';
import { DeviceError } from './entities/device-error.entity';
import { DeviceInfo } from './entities/device-info.entity';
import { Device } from './entities/device.entity';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(DeviceInfo)
    private readonly infoRepo: Repository<DeviceInfo>,
    @InjectRepository(DeviceError)
    private readonly errorRepo: Repository<DeviceError>,
    private readonly mqttService: MqttService,
    private readonly redisService: RedisService,
    private readonly deviceUtil: DeviceUtil,
  ) {}

  async sendMsg(userId: number, dto: SendMsgDto) {
    const { deviceId, message } = dto;

    const machineId = await this.getOwnedDevice(userId, deviceId);

    const queueName = deviceNameUtil.getQueueName(machineId);

    await this.mqttService.publishToDevice(queueName, message);

    let timeoutId: NodeJS.Timeout;

    return new Promise((resolve, reject) => {
      const handleEvent = (data: any) => {
        clearTimeout(timeoutId);

        console.log({data})

        resolve(data);
      };

      eventEmitter.once(machineId, handleEvent);

      timeoutId = setTimeout(() => {
        eventEmitter.off(machineId, handleEvent);
        reject(new RequestTimeoutException("Check your local device."));
      }, 5000);
    });
  }

  async getOwnedDevice(userId: number, deviceId: number) {
    const machineId = await this.redisService.get(`device:${deviceId}`);

    if (machineId) {
      return machineId;
    }

    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: { user: true },
      select: { id: true, machineId: true, user: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.user?.id !== userId) {
      throw new BadRequestException('Device does not belong to user');
    }

    await this.redisService.set(`device:${deviceId}`, device.machineId, 120);

    return device.machineId;
  }

  async getDevices(userId: number, dto: PaginationDto) {
    const { skip, take, order } = getPagination(dto);

    const [list, total] = await this.deviceRepo.findAndCount({
      where: { user: { id: userId } },
      select: { id: true, name: true, description: true },
      skip,
      take,
      order,
    });

    return { list, total };
  }

  async getPairToken(userId: number) {
    const existingToken = await this.redisService.get(`pair:user:${userId}`);

    // one token per user
    if (existingToken) {
      return existingToken;
    }

    const token = randomBytes(32).toString('hex');

    await this.redisService.set(`pair:${token}`, userId.toString(), 120);
    await this.redisService.set(`pair:user:${userId}`, token, 120);

    return token;
  }

  async getMqAccount(dto: MachineIdDto) {
    const { machineId } = dto;

    const device = await this.deviceRepo.findOne({
      where: { machineId },
      relations: { info: true },
      select: { id: true, info: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    let username = device.info?.userId;
    let password = device.info?.pw;

    const { encrypt, decrypt } = this.deviceUtil;

    if (!username || !password) {
      const newAccount = await this.mqttService.createDynamicUser(machineId);

      const queueName = deviceNameUtil.getQueueName(machineId);

      await this.mqttService.createQueue(queueName);

      username = newAccount.username;
      password = newAccount.password;

      const info = this.infoRepo.create({
        deviceId: device.id,
        userId: newAccount.username,
        pw: encrypt(newAccount.password),
      });

      await this.infoRepo.save(info);
    } else {
      password = decrypt(password);
    }

    return { username, password };
  }

  async getStatus(machineId: string) {
    const device = await this.deviceRepo.findOneBy({ machineId });

    return device === null;
  }

  async deleteDevice(deviceId: number) {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: { info: true },
      select: { id: true, info: true, machineId: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.info?.userId) {
      const queueName = deviceNameUtil.getQueueName(device.machineId);

      await this.mqttService.publishToDevice(queueName, { type: MSG.DELETE });

      await this.mqttService.deleteUser(device.info.userId);

      await this.mqttService.deleteQueue(queueName);

      await this.redisService.del(`machine:${device.machineId}`);
    }

    await this.deviceRepo.delete({ id: deviceId });

    return true;
  }

  async pairDevice(dto: PairDeviceDto) {
    const { machineId, name, description, token } = dto;

    // 1. check user
    const userId = await this.getUserIdFromPairToken(token);

    // 2. check device status
    const isOwned = await this.validateDeviceOwnership(machineId, userId);

    // 2.1. device already owned
    if (isOwned) {
      return true;
    }

    // 3. create device
    try {
      const newDevice = this.deviceRepo.create({
        machineId,
        name,
        description,
        user: { id: userId },
      });
      await this.deviceRepo.save(newDevice);
    } catch (e) {
      throw new BadRequestException('Failed to register device');
    }

    // 4. clear cache
    await Promise.all([
      this.redisService.del(`pair:${token}`),
      this.redisService.del(`pair:user:${userId}`),
    ]);

    return true;
  }

  private async getUserIdFromPairToken(token: string): Promise<number> {
    const userId = await this.redisService.get(`pair:${token}`);

    if (!userId) {
      throw new NotFoundException('Pair info not found or expired');
    }

    return Number(userId);
  }

  private async validateDeviceOwnership(machineId: string, userId: number) {
    const existingDevice = await this.deviceRepo.findOne({
      where: { machineId },
      relations: { user: true },
      select: { user: true },
    });

    if (!existingDevice) {
      return false;
    }

    if (existingDevice.user?.id !== userId) {
      throw new BadRequestException('Device already belongs to another user');
    }

    return true;
  }

  async getErrors(userId: number, dto: DeviceErrPageDto) {
    const { skip, take, order } = getPagination(dto);

    const [list, total] = await this.errorRepo.findAndCount({
      where: { device: { id: dto.deviceId, user: { id: userId } } },
      relations: { device: { user: true } },
      skip,
      take,
      order,
    });

    return {
      list,
      total,
    };
  }

  async sendError(dto: SendErrDto) {
    const { machineId, code, message } = dto;

    const deviceId = await this.getDeviceIdByMachineId(machineId);

    const err = this.errorRepo.create({
      code,
      message,
      device: { id: deviceId },
    });

    await this.errorRepo.save(err);

    return true;
  }

  private async getDeviceIdByMachineId(machineId: string) {
    const deviceId = await this.redisService.get(`machine:${machineId}`);

    if (deviceId) {
      return Number(deviceId);
    }

    const device = await this.deviceRepo.findOne({
      where: { machineId },
      select: { id: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.redisService.set(`machine:${machineId}`, `${device.id}`, 120);

    return device.id;
  }
}
