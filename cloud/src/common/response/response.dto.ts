import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T = any> {
  @ApiProperty({ example: 1 })
  code!: number;

  @ApiProperty({ example: 'Success' })
  message!: string;

  @ApiProperty()
  data?: T;
}
