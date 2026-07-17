import { PaginationDto, ResponseDto } from '@/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ConversationIdDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId!: number;
}

export class ConversationResDto extends ResponseDto {
  @ApiProperty({ example: true })
  declare data: boolean;
}

export class ConversationListResDto extends ResponseDto {
  @ApiProperty({
    example: {
      list: [
        {
          id: 1,
          title: 'Project planning',
          createdAt: '2026-07-10T00:00:00.000Z',
          updatedAt: '2026-07-10T00:10:00.000Z',
        },
      ],
      total: 1,
    },
  })
  declare data: any;
}

export class ConversationContentListResDto extends ResponseDto {
  @ApiProperty({
    example: {
      list: [{ id: 1, content: 'Hello', speakerType: 0 }],
      total: 1,
    },
  })
  declare data: any;
}

export class ConversationContentListDto extends PaginationDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  conversationId!: number;
}

export class AddContentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  conversationId!: number;

  @ApiProperty({ example: 'blah blah' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsIn([0, 1])
  speakerType!: 0 | 1;
}
