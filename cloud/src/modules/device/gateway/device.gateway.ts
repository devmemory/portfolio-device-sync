import {
  CurrentUser,
  getTurnInfo,
  MSG,
  WsExceptionFilter,
  WsJwtGuard,
} from '@/common';
import { MqttService } from '@/infrastructure/mqtt/mqtt.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { OnModuleInit, UseFilters, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { deviceNameUtil } from '../device.util';
import { Device } from '../entities/device.entity';

@WebSocketGateway({
  namespace: 'device',
  cors: {
    origin: ['https://www.devmemory.xyz', 'http://localhost:3000'],
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
export class DeviceGateway implements OnModuleInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    private readonly mqttService: MqttService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.mqttService.consumeJson((payload: any) => {
      this.subscribe(payload);
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const queueName = (client as any).queueName;

    if (queueName) {
      this.mqttService.publishToDevice(queueName, { type: MSG.CLOSE });
      console.log(`[ws] Client left. Sent close to ${queueName}`);
    }
  }

  @SubscribeMessage(MSG.JOIN)
  async handleJoinEvent(
    @CurrentUser('id') userId: number,
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { deviceId } = data;

    const queueName = await this.getQueueName(deviceId, userId);

    client.join(`room-${deviceId}`);

    (client as any).queueName = queueName;

    console.log('[ws] join', { deviceId, queueName });

    const turnInfo = getTurnInfo();

    this.mqttService.publishToDevice(queueName, {
      type: MSG.SIGNAL,
      data: turnInfo,
    });
  }

  private subscribe = async (payload: any) => {
    const deviceId = await this.getDeviceId(payload.data.machineId);

    if (!deviceId) {
      throw new WsException('Device id not found');
    }

    switch (payload.type) {
      case MSG.ANSWER:
        const { sdp, type } = payload.data;

        this.server.to(`room-${deviceId}`).emit(MSG.ANSWER, { sdp, type });
        break;
      case MSG.CANDIDATE:
        const { candidate, sdpMid, sdpMLineIndex } = payload.data;

        this.server
          .to(`room-${deviceId}`)
          .emit(MSG.CANDIDATE, { candidate, sdpMid, sdpMLineIndex });
        break;
      case MSG.SIGNAL:
        const config = getTurnInfo();

        this.server
          .to(`room-${deviceId}`)
          .emit(MSG.SIGNAL, JSON.stringify(config));

        console.log(`[ws] signal`, { deviceId, signal: payload.data.signal });
        break;
      default:
        new WsException('Invalid message type');
        break;
    }
  };

  @SubscribeMessage(MSG.OFFER)
  async handleOffer(
    @CurrentUser('id') userId: number,
    @MessageBody() data: any,
  ) {
    const { sdp, type, deviceId } = data;

    const queueName = await this.getQueueName(deviceId, userId);

    this.mqttService.publishToDevice(queueName, {
      type: MSG.OFFER,
      data: { sdp, type },
    });
  }

  @SubscribeMessage(MSG.CANDIDATE)
  async handleCandidate(
    @CurrentUser('id') userId: number,
    @MessageBody() data: any,
  ) {
    const { candidate, sdpMid, sdpMLineIndex, deviceId } = data;

    const queueName = await this.getQueueName(deviceId, userId);

    this.mqttService.publishToDevice(queueName, {
      type: MSG.CANDIDATE,
      data: { candidate, sdpMid, sdpMLineIndex },
    });
  }

  @SubscribeMessage(MSG.CLOSE)
  async handleClose(
    @CurrentUser('id') userId: number,
    @MessageBody() data: any,
  ) {
    const { deviceId } = data;

    const queueName = await this.getQueueName(deviceId, userId);

    this.mqttService.publishToDevice(queueName, { type: MSG.CLOSE });
  }

  private async getQueueName(deviceId: number, userId: number) {
    let queueName = await this.redisService.get(`user:${userId}-${deviceId}`);

    if (queueName) {
      return queueName;
    }

    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, user: { id: userId } },
      relations: { user: true },
      select: { id: true, machineId: true },
    });

    if (!device) {
      throw new WsException('Device not found');
    }

    queueName = deviceNameUtil.getQueueName(device.machineId);

    await this.redisService.set(`user:${userId}-${deviceId}`, queueName, 3600);

    return queueName;
  }

  private async getDeviceId(machineId: string) {
    const deviceId = await this.redisService.get(`machine:${machineId}`);

    if (deviceId) {
      return deviceId;
    }

    const device = await this.deviceRepo.findOne({
      where: { machineId },
      select: { id: true, machineId: true },
    });

    if (!device) {
      throw new WsException('Device not found');
    }

    await this.redisService.set(`machine:${machineId}`, `${device.id}`, 120);

    return device.id;
  }
}
