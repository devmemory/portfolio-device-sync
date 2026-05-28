import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
