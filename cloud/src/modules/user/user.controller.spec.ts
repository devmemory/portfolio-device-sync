import { JwtGuard } from '@/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import {
  AuthDuplicateDto,
  PwDto,
  RefreshDto,
  SigninDto,
  SignupDto,
} from './user.dto';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockAuthService = {
    signin: jest.fn(),
    signup: jest.fn(),
    refresh: jest.fn(),
    duplicate: jest.fn(),
    changePw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockAuthService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('success case', () => {
    it('signin: should return SigninResDto data', async () => {
      const dto: SigninDto = { email: 'test@gmail.com', pw: 'password123' };
      const expectedResult = {
        id: 1,
        email: dto.email,
        accessToken: 'access',
        refreshToken: 'refresh',
      };

      mockAuthService.signin.mockResolvedValue(expectedResult);

      const result = await controller.signin(dto);
      expect(result).toEqual(expectedResult);
      expect(service.signin).toHaveBeenCalledWith(dto);
    });

    it('signup: should handle SignupDto correctly', async () => {
      const dto: SignupDto = {
        email: 'new@gmail.com',
        pw: 'password123',
        name: 'JohnDoe',
      };

      mockAuthService.signup.mockResolvedValue({
        id: 2,
        email: dto.email,
        accessToken: 'act',
        refreshToken: 'ref',
      });

      const result = await controller.signup(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).not.toHaveProperty('pw');
      expect(result).toHaveProperty('id');

      expect(service.signup).toHaveBeenCalledWith(dto);
    });

    it('duplicate: should return true for unique email', async () => {
      const dto: AuthDuplicateDto = { email: 'unique@gmail.com' };
      mockAuthService.duplicate.mockResolvedValue(true);

      const result = await controller.duplicate(dto);
      expect(result).toBe(true);
    });
  });

  describe('failure case', () => {
    it('signin: should propagate NotFoundException (user not found)', async () => {
      const dto: SigninDto = { email: 'unknown@gmail.com', pw: 'password123' };

      mockAuthService.signin.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.signin(dto)).rejects.toThrow(NotFoundException);
    });

    it('refresh: should propagate BadRequestException (invalid token)', async () => {
      const dto: RefreshDto = { userId: 1, refreshToken: 'invalid_token' };

      mockAuthService.refresh.mockRejectedValue(
        new BadRequestException('Invalid refresh token'),
      );

      await expect(controller.refresh(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('changePw: should throw if old password mismatches', async () => {
      const mockUser = { id: 1 };
      const dto: PwDto = { oldPw: 'wrong123', newPw: 'newPass123' };

      mockAuthService.changePw.mockRejectedValue(
        new BadRequestException('Invalid password'),
      );

      await expect(controller.changePw(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('duplicate: should throw if 2 params are sent', async () => {
      const dto: AuthDuplicateDto = {
        email: 'duplicate@gmail.com',
        name: 'name',
      };

      mockAuthService.duplicate.mockRejectedValue(new BadRequestException());

      await expect(controller.duplicate(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
