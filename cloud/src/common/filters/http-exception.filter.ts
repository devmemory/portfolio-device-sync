import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { errorResponse } from '../response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status: number;
    let body: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      // Use your helper
      if (typeof res === 'object' && 'code' in res) {
        body = res;
      } else {
        body = errorResponse(res);
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = errorResponse('Internal server error');
    }

    // // 서버 에러 발생시 바로 전송
    // if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
    //   this.errorService.send({
    //     message: body.message,
    //     path: '[SERVER] httpError: ' + request.url,
    //   });
    // }

    response.status(status).json(body);
  }
}
