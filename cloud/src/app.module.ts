import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  OriginGuard,
  ResponseInterceptor,
  TypeOrmExceptionFilter,
} from './common';
import { DatabaseService } from './DatabaseService';
import { AmqpModule } from './infrastructure/amqp/amqp.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { DeviceModule } from './modules/device/device.module';
import { UserModule } from './modules/user/user.module';
import { ConversationModule } from './modules/conversation/conversation.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      port: 5432,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PW,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      extra: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    RedisModule,
    AmqpModule,
    ConversationModule,
    DeviceModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseService,
    { provide: APP_GUARD, useClass: OriginGuard },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: TypeOrmExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
