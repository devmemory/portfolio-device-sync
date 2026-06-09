import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds_count')
    private readonly counter: Counter,

    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const { method, route } = request;
    const path = route?.path || request.baseUrl || 'unknown';

    if (path.includes('/metrics')) {
      return next.handle();
    }

    // request start time
    const startTime = process.hrtime();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;

        this.recordMetrics(method, path, statusCode, startTime);
      }),

      catchError((error) => {
        const statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        this.recordMetrics(method, path, statusCode, startTime);

        return throwError(() => error);
      }),
    );
  }

  private recordMetrics(
    method: string,
    route: string,
    statusCode: number,
    startTime: [number, number],
  ) {
    // calculate duration
    const diff = process.hrtime(startTime);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
    };

    // update metrics
    this.counter.labels(labels).inc();
    this.histogram.labels(labels).observe(durationInSeconds);
  }
}
