import { RedisService } from '@/infrastructure/redis/redis.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  AuthDuplicateDto,
  PwDto,
  RefreshDto,
  SigninDto,
  SignupDto,
} from './user.dto';
import { userUtil } from './user.util';

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly authRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  private async generateTokenPair(userId: number, updateVersion = false) {
    let tokenVersion = await this.getTokenVersion(userId);

    if (updateVersion) {
      const newTokenVersion = tokenVersion + 1;
      await this.redisService.set(`user:${userId}`, `${newTokenVersion}`);
      await this.authRepo.update(userId, { tokenVersion: newTokenVersion });

      tokenVersion = newTokenVersion;
    }

    const payload = {
      id: userId,
      tokenVersion,
    };

    console.log({ payload });

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '30m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '3d',
    });

    const hashedRefresh = await userUtil.hashPassword(refreshToken);

    return { accessToken, refreshToken, hashedRefresh };
  }

  async signin(dto: SigninDto) {
    const user = await this.authRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        pw: true,
        name: true,
      },
    });

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    const isValid = await userUtil.verifyPassword(dto.pw, user.pw);

    if (!isValid) {
      throw new BadRequestException('Invalid password');
    }

    const { accessToken, refreshToken, hashedRefresh } =
      await this.generateTokenPair(user.id);

    await this.authRepo.update(user.id, {
      refreshToken: hashedRefresh,
    });

    return { accessToken, refreshToken, ...userUtil.safeUser(user) };
  }

  async signup(dto: SignupDto) {
    const user = await this.authRepo.findOne({
      where: { email: dto.email },
      select: { email: true },
    });

    if (user !== null) {
      throw new BadRequestException('Email already exists');
    }

    const pw = await userUtil.hashPassword(dto.pw);

    const newUser = this.authRepo.create({
      email: dto.email,
      pw,
      name: dto.name,
    });

    await this.authRepo.save(newUser);

    const { accessToken, refreshToken, hashedRefresh } =
      await this.generateTokenPair(newUser.id);

    await this.authRepo.update(newUser.id, {
      refreshToken: hashedRefresh,
    });

    return { accessToken, refreshToken, ...userUtil.safeUser(newUser) };
  }

  async refresh(dto: RefreshDto) {
    const auth = await this.authRepo.findOne({
      where: { id: dto.userId },
      select: { id: true, refreshToken: true },
    });

    if (auth === null) {
      throw new NotFoundException('User not found');
    }

    const isValid = await userUtil.verifyPassword(
      dto.refreshToken,
      auth.refreshToken ?? '',
    );

    if (!isValid) {
      throw new BadRequestException('Invalid refresh token');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      hashedRefresh,
    } = await this.generateTokenPair(auth.id, true);

    await this.authRepo.update(auth.id, {
      refreshToken: hashedRefresh,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async duplicate(dto: AuthDuplicateDto) {
    if (dto.email === undefined && dto.name === undefined) {
      throw new BadRequestException('Email or name is required');
    }

    let where = {};

    if (dto.email) {
      where = { email: dto.email };
    } else if (dto.name) {
      where = { name: dto.name };
    }

    const auth = await this.authRepo.findOne({
      where,
      select: { email: true, name: true },
    });

    return auth === null;
  }

  async changePw(id: number, dto: PwDto) {
    const { oldPw, newPw } = dto;

    const user = await this.authRepo.findOne({
      where: { id },
      select: { pw: true },
    });

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    const isValid = await userUtil.verifyPassword(oldPw, user.pw);

    if (!isValid) {
      throw new BadRequestException('Invalid password');
    }

    const pw = await userUtil.hashPassword(newPw);

    await this.authRepo.update(id, { pw });

    return true;
  }

  async getTokenVersion(id: number) {
    let tokenVersion = await this.redisService.get(`user:${id}`);

    if (tokenVersion === null) {
      const user = await this.authRepo.findOneBy({ id });

      if (user === null) {
        throw new NotFoundException('User not found');
      }

      tokenVersion = `${user.tokenVersion}`;

      await this.redisService.set(`user:${id}`, tokenVersion);
    }

    return Number(tokenVersion);
  }
}
