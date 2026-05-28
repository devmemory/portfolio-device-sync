import { WsJwtGuard } from '@/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { DeviceUtil } from './device.util';
import { DeviceError } from './entities/device-error.entity';
import { DeviceInfo } from './entities/device-info.entity';
import { Device } from './entities/device.entity';
import { DeviceGateway } from './gateway/device.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User, Device, DeviceError, DeviceInfo])],
  controllers: [DeviceController],
  providers: [
    DeviceService,
    DeviceUtil,
    DeviceGateway,
    WsJwtGuard,
  ],
})
export class DeviceModule {}
