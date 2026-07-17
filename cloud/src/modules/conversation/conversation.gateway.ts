import {
  CurrentUser,
  eventEmitter,
  MSG,
  SERVICE_NAME,
  SPEAKER_TYPE,
  WsExceptionFilter,
  WsJwtGuard,
} from '@/common';
import { AmqpService } from '@/infrastructure/amqp/amqp.service';
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
    private readonly amqpService: AmqpService,
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
      this.amqpService.publishToDevice(queueName, { type: MSG.CLOSE });
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

    if (conversationId) {
      await this.conversationService.getOwnedConversation(
        userId,
        conversationId,
      );
      client.join(`room-${conversationId}`);
    }

    (client as any).queueName = queueName;

    console.log('[ws] join', { conversationId, queueName });

    this.amqpService.publishToDevice(queueName, {
      type: MSG.READY,
    });
  }

  private subscribe = async (payload: any) => {
    const { machineId, conversationId, result } = payload.data;

    const { deviceId, userId } = await this.getIds(machineId);

    if (!deviceId) {
      throw new WsException('Device id not found');
    }

    switch (payload.type) {
      case MSG.READY:
        this.server.to(`room-${conversationId}`).emit(MSG.READY, { result });
        break;
      case MSG.CONVERSATION:
        this.server
          .to(`room-${conversationId}`)
          .emit(MSG.CONVERSATION, { result });
        break;
      case MSG.SAVE_CONTENT:
        const res = await this.conversationService.addContent(userId, {
          conversationId,
          content: result,
          speakerType: SPEAKER_TYPE.AI,
        });

        console.log('[ws] saved content', { res });
        break;
      default:
        throw new WsException('Invalid type');
        break;
    }
  };

  @SubscribeMessage(MSG.CONVERSATION)
  async handleConversation(
    @CurrentUser('id') userId: number,
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const { prompt, deviceId } = data;
    let conversationId = data.conversationId;

    if (!conversationId) {
      conversationId = await this.conversationService.createConversation(
        userId,
        prompt,
      );
      client.join(`room-${conversationId}`);
    } else {
      await this.conversationService.getOwnedConversation(
        userId,
        conversationId,
      );
    }

    const queueName = await this.getQueueName(deviceId, userId);

    const result = await this.amqpService.publishToDevice(queueName, {
      type: MSG.CONVERSATION,
      data: {
        prompt,
        conversationId,
      },
    });

    if (result && data.conversationId) {
      await this.conversationService.addContent(userId, {
        conversationId,
        content: prompt,
        speakerType: SPEAKER_TYPE.USER,
      });
    }

    return { conversationId, sent: Boolean(result) };
  }

  private async getQueueName(deviceId: number, userId: number) {
    const cacheKey = `conversation:user:${userId}:device:${deviceId}`;
    let queueName = await this.redisService.get(cacheKey);

    if (queueName) {
      return queueName;
    }

    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, user: { id: userId } },
      select: { id: true, machineId: true },
      relations: { user: true },
    });

    if (!device) {
      throw new WsException('Device not found');
    }

    queueName = deviceNameUtil.getQueueName(device.machineId);

    await this.redisService.set(cacheKey, queueName, 3600);

    return queueName;
  }

  private async getIds(machineId: string) {
    const cacheKey = `conversation:machine:${machineId}`;
    const ids = await this.redisService.get(cacheKey);

    if (ids) {
      const [deviceId, userId] = ids.split('-');

      return { deviceId, userId: Number(userId) };
    }

    const device = await this.deviceRepo.findOne({
      where: { machineId },
      select: { id: true, machineId: true, user: true },
      relations: { user: true },
    });

    if (!device) {
      throw new WsException('Device not found');
    }

    console.log({ device });

    await this.redisService.set(
      cacheKey,
      `${device.id}-${device.user!.id}`,
      120,
    );

    return { deviceId: device.id, userId: device.user!.id };
  }
}
