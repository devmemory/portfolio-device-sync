import { SPEAKER_TYPE } from '@/common';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConversationService } from './conversation.service';
import { Content } from './entities/content.entity';
import { Conversation } from './entities/conversation.entity';

describe('ConversationService', () => {
  let service: ConversationService;
  const conversationRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
  };
  const contentRepo = {
    findAndCount: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(),
  };
  const manager = { create: jest.fn(), save: jest.fn() };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: getRepositoryToken(Conversation), useValue: conversationRepo },
        { provide: getRepositoryToken(Content), useValue: contentRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ConversationService);
  });

  it('returns user conversations with pagination', async () => {
    conversationRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

    await expect(service.getConversations(7, { page: 2, limit: 10 })).resolves.toEqual({
      list: [{ id: 1 }],
      total: 1,
    });
    expect(conversationRepo.findAndCount).toHaveBeenCalledWith({
      where: { user: { id: 7 } },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      skip: 10,
      take: 10,
      order: { updatedAt: 'DESC' },
    });
  });

  it('creates a conversation and its first user message transactionally', async () => {
    const conversation = { title: 'Hello', user: { id: 7 } };
    const savedConversation = { ...conversation, id: 3 };
    manager.create
      .mockReturnValueOnce(conversation)
      .mockReturnValueOnce({ content: 'Hello' });
    manager.save.mockResolvedValueOnce(savedConversation).mockResolvedValueOnce({});

    await expect(service.createConversation(7, 'Hello')).resolves.toBe(3);
    expect(manager.create).toHaveBeenLastCalledWith(Content, {
      content: 'Hello',
      speakerType: SPEAKER_TYPE.USER,
      conversation: savedConversation,
    });
  });

  it('returns owned contents oldest first', async () => {
    contentRepo.findAndCount.mockResolvedValue([[{ id: 1 }], 1]);

    await service.getContents(7, { page: 1, limit: 20 }, 3);
    expect(contentRepo.findAndCount).toHaveBeenCalledWith({
      where: { conversation: { id: 3, user: { id: 7 } } },
      skip: 0,
      take: 20,
      order: { createdAt: 'ASC' },
    });
  });

  it('rejects content for a conversation the user does not own', async () => {
    conversationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.addContent(7, { conversationId: 3, content: 'No', speakerType: 0 }),
    ).rejects.toThrow(NotFoundException);
    expect(contentRepo.save).not.toHaveBeenCalled();
  });

  it('soft deletes an owned conversation', async () => {
    conversationRepo.findOne.mockResolvedValue({ id: 3, user: { id: 7 } });
    conversationRepo.softDelete.mockResolvedValue({ affected: 1 });

    await expect(service.deleteConversation(7, 3)).resolves.toBe(true);
    expect(conversationRepo.softDelete).toHaveBeenCalledWith(3);
  });

  it('rejects deleting a conversation the user does not own', async () => {
    conversationRepo.findOne.mockResolvedValue(null);

    await expect(service.deleteConversation(7, 3)).rejects.toThrow(
      NotFoundException,
    );
    expect(conversationRepo.softDelete).not.toHaveBeenCalled();
  });
});
