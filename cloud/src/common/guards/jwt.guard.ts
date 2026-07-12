import { UserService } from '@/modules/user/user.service';
import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RETURN_CODE } from '../constants';
import { CustomException } from '../custom.exception';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'] ?? "";

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new CustomException(
        RETURN_CODE.UNAUTHORIZED,
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      const tokenVersion = await this.userService.getTokenVersion(payload.id);

      if (payload.tokenVersion !== tokenVersion) {
        throw new CustomException(
          RETURN_CODE.EXPIRED_TOKEN,
          'Expired Token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      request.user = payload;

      return true;
    } catch (e) {
      throw new CustomException(
        RETURN_CODE.INVALID_TOKEN,
        'Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

export const CurrentUser = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return key ? user?.[key] : user;
  },
);
