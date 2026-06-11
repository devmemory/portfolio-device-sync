import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { Channel, ConfirmChannel } from 'amqplib';
import { randomBytes } from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private connection?: AmqpConnectionManager;
  private channelWrapper?: ChannelWrapper;
  private admin?: { username: string; password: string };
  private readonly upstreamQueue = 'q_global_upstream';

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    this.admin = {
      username: process.env.RABBITMQ_USER!,
      password: process.env.RABBITMQ_PW!,
    };

    const host = process.env.RABBITMQ_HOST;
    const port = '5672';

    const amqpUrl = `amqp://${this.admin.username}:${this.admin.password}@${host}:${port}`;

    this.connection = amqp.connect([amqpUrl]);

    this.channelWrapper = this.connection.createChannel();

    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.assertQueue(this.upstreamQueue, {
        durable: true,
        autoDelete: false
      });

      this.logger.log('[RabbitMQ] Channel active, running assertions...');
    });
  }

  /**
   * - publishg message to device
   */
  async publishToDevice(queueName: string, payload: Record<string, any>) {
    const buffer = Buffer.from(JSON.stringify(payload));

    return this.channelWrapper?.publish('', queueName, buffer, {
      persistent: false,
      expiration: 60000
    });
  }

  async consumeJson(handler: any) {
    const channel = await this.createRawChannel();

    await channel.prefetch(1);

    const consumeResult = await channel.consume(
      this.upstreamQueue,
      async (message) => {
        if (!message) {
          return;
        }

        try {
          const payload = JSON.parse(message.content.toString());
          console.log(`[mq] Received message`, payload);

          channel.ack(message);
          await handler(payload);
        } catch (error) {
          this.logger.error(
            `[mq] Failed to consume message from device`,
            error,
          );
          channel.nack(message, false, false);
        }
      },
    );

    return {
      close: async () => {
        await channel.cancel(consumeResult.consumerTag);
        await channel.close();
      },
    };
  }

  async onModuleDestroy() {
    await this.channelWrapper?.close();
    await this.connection?.close();
  }

  async createDynamicUser(machineId: string) {
    const baseUrl = `http://${process.env.RABBITMQ_HOST}:15672/api`;
    const username = `user_${randomBytes(4).toString('hex')}`;
    const password = randomBytes(16).toString('base64');

    const permissionRegex = `^(amq\\.default|q_device_${machineId})$`;

    try {
      // 1. Create the user
      await firstValueFrom(
        this.httpService.put(
          `${baseUrl}/users/${username}`,
          { password, tags: '' },
          { auth: this.admin, headers: { 'Content-Type': 'application/json' } },
        ),
      );

      // 2. Set Permissions (Write/Read)
      await firstValueFrom(
        this.httpService.put(
          `${baseUrl}/permissions/%2f/${username}`,
          { configure: '', write: permissionRegex, read: permissionRegex },
          { auth: this.admin, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    } catch (error) {
      console.log(error);

      throw error;
    }

    return { username, password };
  }

  async createQueue(queueName: string) {
    try {
      await this.channelWrapper!.addSetup(async (channel: ConfirmChannel) => {
        console.log('[mq] Channel active, running assertions...');
        await channel.assertQueue(queueName, {
          durable: true,
          autoDelete: false,
        });
      });

      await this.channelWrapper!.waitForConnect();

      console.log('[mq] Creation sequence complete.');
    } catch (error) {
      console.error(`[mq] Failed to create queue for ${queueName}:`, error);
      throw error;
    }
  }

  async deleteUser(username: string) {
    const baseUrl = `http://${process.env.RABBITMQ_HOST}:15672/api`;

    try {
      console.log('[mq] Deleting user...');
      await firstValueFrom(
        this.httpService.delete(`${baseUrl}/users/${username}`, {
          auth: this.admin,
        }),
      );
      console.log(`[mq] User ${username} deleted successfully.`);
    } catch (e) {
      console.log({ e });
    }
  }

  async deleteQueue(queueName: string) {
    const channel = await this.createRawChannel();
    try {
      await channel.deleteQueue(queueName, { ifUnused: false, ifEmpty: false });
      this.logger.log(`[mq] Queue ${queueName} deleted.`);
    } finally {
      await channel.close(); // Cleanly closes raw channel immediately
    }
  }

  private async createRawChannel(): Promise<Channel> {
    await this.channelWrapper?.waitForConnect();

    // Get the raw underlying amqplib connection from the manager
    const rawConnection = (this.connection as any)?._currentConnection;
    if (!rawConnection) {
      throw new Error('No active MQ connection');
    }

    return rawConnection.createChannel();
  }
}
