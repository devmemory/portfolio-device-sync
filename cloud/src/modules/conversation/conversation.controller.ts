import { CurrentUser, JwtGuard, PaginationDto } from '@/common';
import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConversationListResDto } from './conversation.dto';
import { ConversationService } from './conversation.service';

@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @ApiOperation({ summary: 'get conversations' })
  @ApiResponse({ status: HttpStatus.OK, type: ConversationListResDto })
  @Get('/list')
  getConversations(
    @CurrentUser('id') userId: number,
    @Query() query: PaginationDto,
  ) {
    return this.conversationService.getConversations(userId, query);
  }
}
