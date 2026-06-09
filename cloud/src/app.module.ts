import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { makeCounterProvider, makeHistogramProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  MetricsInterceptor,
  OriginGuard,
  ResponseInterceptor,
  TypeOrmExceptionFilter,
} from './common';
import { DatabaseService } from './DatabaseService';
import { MqttModule } from './infrastructure/mqtt/mqtt.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { DeviceModule } from './modules/device/device.module';
import { UserModule } from './modules/user/user.module';

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
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      defaultLabels: {
        app: 'app',
      },
      path: '/metrics',
    }),
    RedisModule,
    MqttModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    makeCounterProvider({
      name: 'http_request_duration_seconds_count',
      help: 'Total number of HTTP requests throughput',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
  ],
})
export class AppModule {}
