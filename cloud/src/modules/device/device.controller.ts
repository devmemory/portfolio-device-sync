import { CurrentUser, JwtGuard, LocalPCGuard, PaginationDto } from '@/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AccountResDto,
  DeviceErrPageDto,
  DeviceIdDto,
  DeviceListResDto,
  DeviceResDto,
  GetPairTokenResDto,
  MachineIdDto,
  PairDeviceDto,
  SendErrDto,
  SendMsgDto,
} from './device.dto';
import { DeviceService } from './device.service';

@ApiBearerAuth()
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'send message' })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceResDto })
  @Post('/send')
  sendMsg(@CurrentUser('id') userId: number, @Body() dto: SendMsgDto) {
    return this.deviceService.sendMsg(userId, dto);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'get devices' })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceListResDto })
  @Get('/list')
  getDevices(@CurrentUser('id') userId: number, @Query() query: PaginationDto) {
    return this.deviceService.getDevices(userId, query);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'get device errors' })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceListResDto })
  @Get('/errors')
  getErrors(
    @CurrentUser('id') userId: number,
    @Query() query: DeviceErrPageDto,
  ) {
    return this.deviceService.getErrors(userId, query);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'get pair token' })
  @ApiResponse({ status: HttpStatus.OK, type: GetPairTokenResDto })
  @Post('/pair-token')
  getPairToken(@CurrentUser('id') userId: number) {
    return this.deviceService.getPairToken(userId);
  }

  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'delete device' })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceResDto })
  @Delete('/remove')
  deleteDevice(@Body() dto: DeviceIdDto) {
    return this.deviceService.deleteDevice(dto.deviceId);
  }

  @UseGuards(LocalPCGuard)
  @ApiOperation({ summary: 'pair device' })
  @ApiHeader({
    name: 'x-app-auth',
    description: process.env.APP_AUTH,
    required: true,
  })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceResDto })
  @Post('/pair')
  pairDevice(@Body() dto: PairDeviceDto) {
    return this.deviceService.pairDevice(dto);
  }

  @UseGuards(LocalPCGuard)
  @ApiOperation({ summary: 'device status' })
  @ApiHeader({
    name: 'x-app-auth',
    description: process.env.APP_AUTH,
    required: true,
  })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceResDto })
  @Post('/status')
  getStatus(@Body() dto: MachineIdDto) {
    return this.deviceService.getStatus(dto.machineId);
  }

  @UseGuards(LocalPCGuard)
  @ApiOperation({ summary: 'get mq account' })
  @ApiHeader({
    name: 'x-app-auth',
    description: process.env.APP_AUTH,
    required: true,
  })
  @ApiResponse({ status: HttpStatus.OK, type: AccountResDto })
  @Post('/mq-account')
  getMqAccount(@Body() dto: MachineIdDto) {
    return this.deviceService.getMqAccount(dto);
  }

  @UseGuards(LocalPCGuard)
  @ApiOperation({ summary: 'send error' })
  @ApiHeader({
    name: 'x-app-auth',
    description: process.env.APP_AUTH,
    required: true,
  })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceResDto })
  @Post('/error')
  sendError(@Body() dto: SendErrDto) {
    return this.deviceService.sendError(dto);
  }
}
