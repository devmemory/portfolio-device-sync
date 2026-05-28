/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { RedisService } from '@/infrastructure/redis/redis.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { userUtil } from './user.util';

describe('UserService', () => {
  let service: UserService;
  let repo: any;
  let redisService: any;

  // Mock Data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    pw: 'hashed_password',
    name: 'Test User',
    tokenVersion: 1,
    refreshToken: 'hashed_refresh',
  };

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock_token'),
    };

    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(getRepositoryToken(User));
    redisService = module.get(RedisService);

    // Mock utility functions to avoid real hashing/verification overhead
    jest.spyOn(userUtil, 'verifyPassword').mockResolvedValue(true);
    jest.spyOn(userUtil, 'hashPassword').mockResolvedValue('hashed');
  });

  describe('signin', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'wrong@test.com', pw: '1234' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return tokens and user info on success', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('1'); // Mock getTokenVersion

      const result = await service.signin({
        email: 'test@test.com',
        pw: 'correct',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user.id', 1);
      expect(result).toHaveProperty('user.name', 'Test User');
      expect(result).not.toHaveProperty('pw');
      expect(result).not.toHaveProperty('user.pw');
      expect(repo.update).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should increment token version in Redis and DB when updateVersion is true', async () => {
      const dto = { userId: 1, refreshToken: 'valid_token' };
      repo.findOne.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('1');

      const result = await service.refresh(dto);

      // Verify Redis was updated with version "2"
      expect(redisService.set).toHaveBeenCalledWith('user:1', '2');
      // Verify DB was updated
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ tokenVersion: 2 }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw BadRequestException if refresh token is invalid', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(userUtil, 'verifyPassword').mockResolvedValue(false);

      await expect(
        service.refresh({ userId: 1, refreshToken: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTokenVersion', () => {
    it('should fetch from DB and save to Redis if Redis is empty', async () => {
      redisService.get.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(mockUser);

      const version = await service.getTokenVersion(1);

      expect(version).toBe(1);
      expect(redisService.set).toHaveBeenCalledWith('user:1', '1');
    });

    it('should return version from Redis if it exists', async () => {
      redisService.get.mockResolvedValue('5');

      const version = await service.getTokenVersion(1);

      expect(version).toBe(5);
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });
  });
});
