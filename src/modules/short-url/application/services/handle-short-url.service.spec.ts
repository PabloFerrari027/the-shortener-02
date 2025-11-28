import { Test, TestingModule } from '@nestjs/testing';
import { HandleShortUrlService } from './handle-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { CustomError } from 'src/shared/common/custom-error';

describe('HandleShortUrlService', () => {
  let service: HandleShortUrlService;
  let repository: jest.Mocked<ShortUrlRepository>;

  const mockShortUrlRepository = {
    count: jest.fn(),
    create: jest.fn(),
    findByHash: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleShortUrlService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockShortUrlRepository,
        },
      ],
    }).compile();

    service = module.get<HandleShortUrlService>(HandleShortUrlService);
    repository = module.get('ShortUrlRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should find short url by hash, increment click count and update it', async () => {
      const hash = 'abc123';
      const mockShortUrl = ShortUrl.create({
        hash,
        url: 'https://example.com',
      });
      const initialClickCount = mockShortUrl.clickCount;

      repository.findByHash.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const result = await service.execute({ hash });

      expect(repository.findByHash).toHaveBeenCalledTimes(1);
      expect(repository.findByHash).toHaveBeenCalledWith(hash);
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
      expect(result.shortUrl).toBe(mockShortUrl);
      expect(result.shortUrl.clickCount).toBe(initialClickCount + 1);
    });

    it('should increment click count correctly on multiple calls', async () => {
      const hash = 'xyz789';
      const mockShortUrl = ShortUrl.create({
        hash,
        url: 'https://test.com',
      });

      repository.findByHash.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      await service.execute({ hash });
      const secondResult = await service.execute({ hash });

      expect(secondResult.shortUrl.clickCount).toBe(2);
      expect(repository.update).toHaveBeenCalledTimes(2);
    });

    it('should throw ShortUrlNotFoundError when hash does not exist', async () => {
      const nonExistentHash = 'notfound';
      repository.findByHash.mockResolvedValue(null);

      await expect(service.execute({ hash: nonExistentHash })).rejects.toThrow(
        ShortUrlNotFoundError,
      );
      await expect(service.execute({ hash: nonExistentHash })).rejects.toThrow(
        nonExistentHash,
      );
      expect(repository.findByHash).toHaveBeenCalledWith(nonExistentHash);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ShortUrlNotFoundError with correct hash in error message', async () => {
      const hash = 'missing123';
      repository.findByHash.mockResolvedValue(null);

      try {
        await service.execute({ hash });
        fail('Should have thrown ShortUrlNotFoundError');
      } catch (err) {
        const error = err as CustomError;
        expect(error).toBeInstanceOf(ShortUrlNotFoundError);
        expect(error.message).toContain(hash);
      }
    });

    it('should propagate repository findByHash errors', async () => {
      const hash = 'abc123';
      const error = new Error('Database connection failed');
      repository.findByHash.mockRejectedValue(error);

      await expect(service.execute({ hash })).rejects.toThrow(
        'Database connection failed',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should propagate repository update errors', async () => {
      const hash = 'abc123';
      const mockShortUrl = ShortUrl.create({
        hash,
        url: 'https://example.com',
      });
      const error = new Error('Failed to update');

      repository.findByHash.mockResolvedValue(mockShortUrl);
      repository.update.mockRejectedValue(error);

      await expect(service.execute({ hash })).rejects.toThrow(
        'Failed to update',
      );
      expect(repository.findByHash).toHaveBeenCalledWith(hash);
    });

    it('should update the updatedAt timestamp when incrementing click count', async () => {
      const hash = 'test123';
      const mockShortUrl = ShortUrl.create({
        hash,
        url: 'https://example.com',
      });
      const initialUpdatedAt = mockShortUrl.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      repository.findByHash.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const result = await service.execute({ hash });

      expect(result.shortUrl.updatedAt.getTime()).toBeGreaterThan(
        initialUpdatedAt.getTime(),
      );
    });

    it('should return the same ShortUrl instance that was updated', async () => {
      const hash = 'same123';
      const mockShortUrl = ShortUrl.create({
        hash,
        url: 'https://example.com',
      });

      repository.findByHash.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const result = await service.execute({ hash });

      expect(result.shortUrl).toBe(mockShortUrl);
      expect(result.shortUrl.hash).toBe(hash);
    });
  });
});
