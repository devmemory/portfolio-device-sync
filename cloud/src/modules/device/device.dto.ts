import { PaginationDto, ResponseDto } from '@/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PairDeviceDto {
  @ApiProperty({ example: 'blahbalh' })
  @MinLength(7)
  @IsString()
  machineId!: string;

  @ApiProperty({ example: 'blahbalh' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'blahbalh' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  name!: string;

  @ApiProperty({ example: 'blahbalh' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;
}

export class MachineIdDto {
  @ApiProperty({ example: 'blahbalh' })
  @MinLength(7)
  @IsString()
  machineId!: string;
}

export class DeviceIdDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  deviceId!: number;
}

class MessagePayload {
  @ApiProperty({ example: 'notification' })
  @IsString()
  type!: string;

  @ApiProperty({ example: { key: 'value' } })
  @IsOptional()
  data?: any;
}

export class SendMsgDto extends DeviceIdDto {
  @ApiProperty({ example: 'blahbalh' })
  @IsObject()
  @Type(() => MessagePayload)
  message!: Record<string, any>;
}

export class SendErrDto {
  @ApiProperty({ example: 'blahbalh' })
  @MinLength(7)
  @IsString()
  machineId!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  code!: number;

  @ApiProperty({ example: 'blahbalh' })
  @IsString()
  message!: string;
}

export class DeviceListResDto extends ResponseDto {
  @ApiProperty({
    example: {
      list: [
        {
          id: 'blahbalh',
          name: 'blahbalh',
          description: 'blahbalh',
          createdAt: 'blahbalh',
        },
      ],
      total: 1,
    },
  })
  declare data: any;
}

export class DeviceErrPageDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'blahbalh' })
  @Type(() => Number)
  @IsInt()
  deviceId!: number;
}

export class GetPairTokenResDto extends ResponseDto {
  @ApiProperty({ example: 'blahblah' })
  declare data: any;
}

export class DeviceResDto extends ResponseDto {
  @ApiProperty({
    example: true,
    description: 'true:success, false: fail',
  })
  declare data: any;
}

export class AccountResDto extends ResponseDto {
  @ApiProperty({
    example: {
      username: 'blah',
      password: 'blah',
    },
  })
  declare data: any;
}
