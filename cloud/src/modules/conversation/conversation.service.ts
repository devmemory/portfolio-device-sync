import { getPagination, PaginationDto, SPEAKER_TYPE } from '@/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AddContentDto } from './conversation.dto';
import { Content } from './entities/content.entity';
import { Conversation } from './entities/conversation.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    private readonly dataSource: DataSource,
  ) {}

  async createConversation(userId: number, message: string) {
    let title = message;

    if (title.length > 50) {
      title = title.slice(0, 50);
    }

    return this.dataSource.transaction(async (manager) => {
      const conversation = manager.create(Conversation, {
        title,
        user: { id: userId },
      });

      const savedConversation = await manager.save(Conversation, conversation);

      const content = manager.create(Content, {
        content: message,
        speakerType: SPEAKER_TYPE.USER,
        list: savedConversation,
      });

      await manager.save(Content, content);

      return true;
    });
  }

  async getConversations(userId: number, dto: PaginationDto) {
    const { skip, take, order } = getPagination(dto);

    const [list, total] = await this.conversationRepo.findAndCount({
      where: { user: { id: userId } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        user: true
      },
      skip,
      take,
      order: order ?? { updatedAt: 'DESC' },
    });

    return { list, total };
  }

  async getContents(
    userId: number,
    dto: PaginationDto,
    conversationId: number,
  ) {
    const { skip, take } = getPagination(dto);

    const [list, total] = await this.contentRepo.findAndCount({
      where: { conversation: { id: conversationId, user: { id: userId } } },
      skip,
      take,
    });

    return { list, total };
  }

  async addContent(userId: number, dto: AddContentDto) {
    const { conversationId, content, speakerType } = dto;

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, user: { id: userId } },
      select: { id: true, user: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation is not found.');
    }

    const newContent = this.contentRepo.create({
      conversation,
      content,
      speakerType,
    });

    return await this.contentRepo.save(newContent);
  }
}
