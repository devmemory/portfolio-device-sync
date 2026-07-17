import { CurrentUser, JwtGuard, PaginationDto } from '@/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ConversationContentListResDto,
  ConversationContentListDto,
  ConversationIdDto,
  ConversationListResDto,
  ConversationResDto,
} from './conversation.dto';
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

  @ApiOperation({ summary: 'get conversation contents' })
  @ApiResponse({ status: HttpStatus.OK, type: ConversationContentListResDto })
  @Get('/contents')
  getContents(
    @CurrentUser('id') userId: number,
    @Query() query: ConversationContentListDto,
  ) {
    return this.conversationService.getContents(
      userId,
      query,
      query.conversationId,
    );
  }

  @ApiOperation({ summary: 'delete conversation' })
  @ApiResponse({ status: HttpStatus.OK, type: ConversationResDto })
  @Delete('/remove')
  deleteConversation(
    @CurrentUser('id') userId: number,
    @Body() dto: ConversationIdDto,
  ) {
    return this.conversationService.deleteConversation(
      userId,
      dto.conversationId,
    );
  }
}
