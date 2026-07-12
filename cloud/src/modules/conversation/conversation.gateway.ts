import {
  CurrentUser,
  eventEmitter,
  MSG,
  SERVICE_NAME,
  SPEAKER_TYPE,
  WsExceptionFilter,
  WsJwtGuard,
} from '@/common';
import { MqttService } from '@/infrastructure/mqtt/mqtt.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import {
  OnModuleDestroy,
  OnModuleInit,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
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
import { deviceNameUtil } from '../device/device.util';
import { Device } from '../device/entities/device.entity';
import { ConversationService } from './conversation.service';

@WebSocketGateway({
  namespace: 'conversation',
  cors: {
    origin: ['https://www.devmemory.xyz', 'http://localhost:3000'],
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
@UseFilters(WsExceptionFilter)
export class ConversationGateway
  implements OnModuleInit, OnModuleDestroy, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    private readonly conversationService: ConversationService,
    private readonly mqttService: MqttService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    eventEmitter.on(SERVICE_NAME.AI, this.subscribe);
  }

  onModuleDestroy() {
    eventEmitter.off(SERVICE_NAME.AI, this.subscribe);
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
    const { deviceId, conversationId } = data;

    const queueName = await this.getQueueName(deviceId, userId);

    client.join(`room-${conversationId}`);

    (client as any).queueName = queueName;

    console.log('[ws] join', { conversationId, queueName });

    this.mqttService.publishToDevice(queueName, {
      type: MSG.SIGNAL,
    });
  }

  private subscribe = async (payload: any) => {
    const { machineId, conversationId, result } = payload.data;

    const { deviceId, userId } = await this.getIds(machineId);

    if (!deviceId) {
      throw new WsException('Device id not found');
    }

    if (payload.type === MSG.CONVERSATION) {
      this.server
        .to(`room-${conversationId}`)
        .emit(MSG.CONVERSATION, { result });

      await this.conversationService.addContent(userId, {
        conversationId,
        content: result,
        speakerType: SPEAKER_TYPE.AI,
      });
    } else {
      throw new WsException('Invalid type');
    }
  };

  @SubscribeMessage(MSG.CONVERSATION)
  async handleOffer(
    @CurrentUser('id') userId: number,
    @MessageBody() data: any,
  ) {
    const { prompt, deviceId, conversationId } = data;

    const queueName = await this.getQueueName(deviceId, userId);

    const result = await this.mqttService.publishToDevice(queueName, {
      type: MSG.CONVERSATION,
      data: {
        prompt,
      },
    });

    if (result) {
      await this.conversationService.addContent(userId, {
        conversationId,
        content: prompt,
        speakerType: SPEAKER_TYPE.USER,
      });
    }
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

  private async getIds(machineId: string) {
    const ids = await this.redisService.get(`machine:${machineId}`);

    if (ids) {
      const [deviceId, userId] = ids.split('-');

      return { deviceId, userId: Number(userId) };
    }

    const device = await this.deviceRepo.findOne({
      where: { machineId },
      select: { id: true, machineId: true, user: true },
    });

    if (!device) {
      throw new WsException('Device not found');
    }

    await this.redisService.set(
      `machine:${machineId}`,
      `${device.id}-${device.user!.id}`,
      120,
    );

    return { deviceId: device.id, userId: device.user!.id };
  }
}
