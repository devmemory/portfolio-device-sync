import { HttpException, HttpStatus } from '@nestjs/common';
import { RETURN_CODE_TYPE } from './constants';

export class CustomException extends HttpException {
  constructor(
    public readonly code: RETURN_CODE_TYPE,
    public readonly message: string,
    status: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message, data: null }, status);
  }
}
