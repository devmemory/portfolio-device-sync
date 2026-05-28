import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

export const allowOrigin = () => {
  let list: string[] = ['', process.env.CLIENT!];

  const devMode = ['http://localhost:8080'];

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    list = [...list, ...devMode];
  }

  return list;
};

@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers.origin || request.headers.referer || '';

    const allowedOrigins = allowOrigin();

    const isAllowed = allowedOrigins.some((o) => origin.startsWith(o));

    console.log({
      origin,
      allowedOrigins,
      isAllowed,
    });

    if (!isAllowed) {
      throw new ForbiddenException('Invalid request origin');
    }

    return true;
  }
}

export class LocalPCGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const appAuth = request.headers['x-app-auth'];

    return appAuth === process.env.APP_AUTH;
  }
}
