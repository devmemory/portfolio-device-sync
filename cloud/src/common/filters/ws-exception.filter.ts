import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const error = exception.getError();

    // Sends a clean error event back to the frontend
    client.emit('error', {
      status: 'error',
      message: typeof error === 'object' ? error : { message: error },
    });
  }
}
