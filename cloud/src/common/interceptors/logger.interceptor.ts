import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Ensure this logs ALL http methods
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();

    // If it's not an HTTP request (e.g. GraphQL, WS), skip
    if (!req) return next.handle();

    const { method, url, params, query, body } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.log({
          method,
          url,
          duration,
          params,
          query,
        });
      }),
      catchError((err) => {
        const duration = Date.now() - start;

        this.logger.error({
          method,
          url,
          duration,
          params,
          query,
          body, // allowed only when error
          error: err.message,
        });

        throw err;
      }),
    );
  }
}
