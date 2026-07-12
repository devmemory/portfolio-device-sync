import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationController } from './conversation.controller';
import { ConversationGateway } from './conversation.gateway';
import { ConversationService } from './conversation.service';
import { Content } from './entities/content.entity';
import { Conversation } from './entities/conversation.entity';
import { WsJwtGuard } from '@/common';
import { Device } from '../device/entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Content, Device])],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationGateway, WsJwtGuard],
})
export class ConversationModule {}
