import { OneOfConstraint, ResponseDto } from '@/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';

export class SigninDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  @MinLength(7)
  @MaxLength(50)
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  pw!: string;
}

export class SignupDto extends SigninDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  name!: string;
}

export class AuthDuplicateDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  @IsOptional()
  @MinLength(7)
  @MaxLength(50)
  @Validate(OneOfConstraint, ['email', 'name'])
  email?: string;

  @ApiProperty({ example: 'name' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  @Validate(OneOfConstraint, ['email', 'name'])
  name?: string;
}

export class PwDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  oldPw!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  newPw!: string;
}

export class RefreshDto {
  @ApiProperty({ example: 'accessToken' })
  @IsNumber()
  userId!: number;

  @ApiProperty({ example: 'refreshToken' })
  @IsString()
  refreshToken!: string;
}

export class SigninResDto extends ResponseDto {
  @ApiProperty({
    example: {
      id: 1,
      email: 'example@gmail.com',
      name: 'name',
      thumbnail: 'https://example.com/image.jpg',
      level: 1,
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    },
  })
  declare data: any;
}

export class DuplicateResDto extends ResponseDto {
  @ApiProperty({
    description: 'true: ok, false: duplicated',
    example: true,
  })
  declare data: any;
}

export class ChangePwResDto extends ResponseDto {
  @ApiProperty({
    description: 'true: ok, false: fail',
    example: true,
  })
  declare data: any;
}

export class RefreshResDto extends ResponseDto {
  @ApiProperty({
    example: {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    },
  })
  declare data: any;
}
