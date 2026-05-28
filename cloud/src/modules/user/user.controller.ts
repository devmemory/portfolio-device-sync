import { CurrentUser, JwtGuard } from '@/common';
import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AuthDuplicateDto,
  ChangePwResDto,
  DuplicateResDto,
  PwDto,
  RefreshDto,
  RefreshResDto,
  SigninDto,
  SigninResDto,
  SignupDto,
} from './user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Signin' })
  @ApiResponse({ status: HttpStatus.OK, type: SigninResDto })
  @Post('/signin')
  signin(@Body() dto: SigninDto) {
    return this.userService.signin(dto);
  }

  @ApiOperation({ summary: 'Signup' })
  @ApiResponse({ status: HttpStatus.OK, type: SigninResDto })
  @Post('/signup')
  signup(@Body() dto: SignupDto) {
    return this.userService.signup(dto);
  }

  @ApiOperation({ summary: 'refresh' })
  @ApiResponse({ status: HttpStatus.OK, type: RefreshResDto })
  @Post('/refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.userService.refresh(dto);
  }

  @ApiOperation({ summary: 'Duplicate' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DuplicateResDto,
    description: 'false: duplicated',
  })
  @Post('/duplicate')
  duplicate(@Body() dto: AuthDuplicateDto) {
    return this.userService.duplicate(dto);
  }

  @ApiOperation({ summary: 'Change pw' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'true: ok',
    type: ChangePwResDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('/change-pw')
  changePw(@CurrentUser() user, @Body() dto: PwDto) {
    return this.userService.changePw(user.id, dto);
  }
}
