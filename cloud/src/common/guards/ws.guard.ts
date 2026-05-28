import { UserService } from '@/modules/user/user.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();

      const authHeader = client.handshake?.headers?.authorization;

      if (!authHeader) {
        throw new WsException('Missing authorization credentials');
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        throw new WsException('Invalid authorization format');
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      const tokenVersion = await this.userService.getTokenVersion(payload.id);

      if (payload.tokenVersion !== tokenVersion) {
        throw new WsException('Expired or revoked token');
      }

      client.user = payload;
      client.isLocalServer = false;

      return true;
    } catch (e) {
      if (e instanceof WsException) {
        throw e;
      }

      throw new WsException('Unauthorized');
    }
  }
}
