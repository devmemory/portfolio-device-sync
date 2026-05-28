/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

jest.mock('ioredis', () => jest.fn());

describe('RedisService', () => {
  let service: RedisService;
  let module: TestingModule;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = {
      on: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    (Redis as unknown as jest.Mock).mockImplementation(() => redisClient);

    module = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);

    await module.init();
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  it('initializes a Redis client without requiring a live Redis server', () => {
    expect(Redis).toHaveBeenCalledWith(
      expect.objectContaining({
        host: expect.any(String),
        port: expect.any(Number),
        retryStrategy: expect.any(Function),
      }),
    );
    expect(redisClient.on).toHaveBeenCalledWith(
      'connect',
      expect.any(Function),
    );
    expect(redisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('sets data without ttl', async () => {
    await service.set('key1', 'value1');

    expect(redisClient.set).toHaveBeenCalledWith('key1', 'value1');
  });

  it('sets data with ttl', async () => {
    await service.set('key1', 'value1', 60);

    expect(redisClient.set).toHaveBeenCalledWith('key1', 'value1', 'EX', 60);
  });

  it('gets and deletes data', async () => {
    redisClient.get.mockResolvedValue('value1');
    redisClient.del.mockResolvedValue(1);

    const value = await service.get('key1');
    const del = await service.del('key1');

    expect(value).toBe('value1');
    expect(del).toBe(1);
    expect(redisClient.get).toHaveBeenCalledWith('key1');
    expect(redisClient.del).toHaveBeenCalledWith('key1');
  });

  it('closes the Redis client on module destroy', async () => {
    await service.onModuleDestroy();

    expect(redisClient.quit).toHaveBeenCalled();
  });
});
