/* eslint-disable @typescript-eslint/unbound-method */
import { JwtGuard } from '@/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

describe('ConversationController', () => {
  let controller: ConversationController;
  let service: ConversationService;

  const mockConversationService = {
    getConversations: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        { provide: ConversationService, useValue: mockConversationService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConversationController>(ConversationController);
    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates the current user and pagination query', async () => {
    const query = { page: 2, limit: 10 };
    const expected = { list: [{ id: 1, title: 'Project planning' }], total: 1 };
    mockConversationService.getConversations.mockResolvedValue(expected);

    await expect(controller.getConversations(7, query)).resolves.toEqual(
      expected,
    );
    expect(service.getConversations).toHaveBeenCalledWith(7, query);
  });
});
