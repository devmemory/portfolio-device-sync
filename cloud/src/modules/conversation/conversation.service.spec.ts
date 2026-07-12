import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationService } from './conversation.service';
import { ConversationList } from './entities/conversation.entity';

describe('ConversationService', () => {
  let service: ConversationService;
  let conversationListRepo: any;

  beforeEach(async () => {
    conversationListRepo = {
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: getRepositoryToken(ConversationList),
          useValue: conversationListRepo,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the current user conversations with pagination', async () => {
    const list = [{ id: 1, title: 'Project planning' }];
    conversationListRepo.findAndCount.mockResolvedValue([list, 1]);

    await expect(
      service.getConversations(7, { page: 2, limit: 10 }),
    ).resolves.toEqual({
      list,
      total: 1,
    });
    expect(conversationListRepo.findAndCount).toHaveBeenCalledWith({
      where: { user: { id: 7 } },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: 10,
      take: 10,
      order: { updatedAt: 'DESC' },
    });
  });

  it('uses the requested sort order when provided', async () => {
    conversationListRepo.findAndCount.mockResolvedValue([[], 0]);

    await service.getConversations(7, {
      page: 1,
      limit: 10,
      orderBy: 'createdAt',
      order: 'ASC',
    });

    expect(conversationListRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'ASC' } }),
    );
  });
});
