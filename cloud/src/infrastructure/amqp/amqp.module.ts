import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { AmqpService } from './amqp.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AmqpService],
  exports: [AmqpService],
})
export class AmqpModule {}
