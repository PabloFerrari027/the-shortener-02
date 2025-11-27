import { Test, TestingModule } from '@nestjs/testing';
import { UpdateShortUrlService } from './update-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

describe('UpdateShortUrlService', () => {
  let service: UpdateShortUrlService;
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
        UpdateShortUrlService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockShortUrlRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateShortUrlService>(UpdateShortUrlService);
    repository = module.get('ShortUrlRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should find short url by id, update url and save it', async () => {
      const id = 'test-id-123';
      const oldUrl = 'https://old-url.com';
      const newUrl = 'https://new-url.com';

      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: oldUrl,
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const input = { id, url: newUrl };

      const result = await service.execute(input);

      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
      expect(result.shortUrl).toBe(mockShortUrl);
      expect(result.shortUrl.url).toBe(newUrl);
    });

    it('should update the updatedAt timestamp when url is changed', async () => {
      const id = 'test-id-456';
      const mockShortUrl = ShortUrl.create({
        hash: 'xyz789',
        url: 'https://original.com',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      const initialUpdatedAt = mockShortUrl.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const input = { id, url: 'https://updated.com' };

      const result = await service.execute(input);

      expect(result.shortUrl.updatedAt.getTime()).toBeGreaterThan(
        initialUpdatedAt.getTime(),
      );
    });

    it('should throw ShortUrlNotFoundError when id does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      const input = { id: nonExistentId, url: 'https://test.com' };

      await expect(service.execute(input)).rejects.toThrow(
        ShortUrlNotFoundError,
      );
      await expect(service.execute(input)).rejects.toThrow(nonExistentId);
      expect(repository.findById).toHaveBeenCalledWith(nonExistentId);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ShortUrlNotFoundError with correct id in error message', async () => {
      const id = 'missing-id-789';
      repository.findById.mockResolvedValue(null);

      const input = { id, url: 'https://test.com' };

      try {
        await service.execute(input);
        fail('Should have thrown ShortUrlNotFoundError');
      } catch (err) {
        const error = err as Error;
        expect(error).toBeInstanceOf(ShortUrlNotFoundError);
        expect(error.message).toContain(id);
      }
    });

    it('should throw error when url is invalid (empty)', async () => {
      const id = 'test-id-invalid';
      const mockShortUrl = ShortUrl.create({
        hash: 'valid123',
        url: 'https://valid.com',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      repository.findById.mockResolvedValue(mockShortUrl);

      const input = { id, url: '' };

      await expect(service.execute(input)).rejects.toThrow();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when url is invalid (only whitespace)', async () => {
      const id = 'test-id-whitespace';
      const mockShortUrl = ShortUrl.create({
        hash: 'valid456',
        url: 'https://valid.com',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      repository.findById.mockResolvedValue(mockShortUrl);

      const input = { id, url: '   ' };

      await expect(service.execute(input)).rejects.toThrow();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should propagate repository findById errors', async () => {
      const id = 'error-id';
      const error = new Error('Database connection failed');
      repository.findById.mockRejectedValue(error);

      const input = { id, url: 'https://test.com' };

      await expect(service.execute(input)).rejects.toThrow(
        'Database connection failed',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should propagate repository update errors', async () => {
      const id = 'test-id-update-error';
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: 'https://old.com',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      const error = new Error('Failed to update');
      repository.findById.mockResolvedValue(mockShortUrl);
      repository.update.mockRejectedValue(error);

      const input = { id, url: 'https://new.com' };

      await expect(service.execute(input)).rejects.toThrow('Failed to update');
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should successfully update to a different valid url', async () => {
      const id = 'test-id-different';
      const mockShortUrl = ShortUrl.create({
        hash: 'diff123',
        url: 'https://example.com/path1',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const newUrl = 'https://different-domain.org/path2?query=param';
      const input = { id, url: newUrl };

      const result = await service.execute(input);

      expect(result.shortUrl.url).toBe(newUrl);
      expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
    });

    it('should return the same ShortUrl instance that was updated', async () => {
      const id = 'same-instance-id';
      const mockShortUrl = ShortUrl.create({
        hash: 'same123',
        url: 'https://original.com',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const input = { id, url: 'https://updated.com' };

      const result = await service.execute(input);

      expect(result.shortUrl).toBe(mockShortUrl);
      expect(result.shortUrl.id).toBe(id);
    });

    it('should preserve other properties when updating url', async () => {
      const id = 'preserve-props-id';
      const hash = 'preserve123';
      const mockShortUrl = ShortUrl.create({
        hash,
        url: 'https://original.com',
      });

      Object.defineProperty(mockShortUrl, 'props', {
        value: { ...mockShortUrl['props'], id },
        writable: true,
      });

      mockShortUrl.incrementClickCount();
      const clickCountBeforeUpdate = mockShortUrl.clickCount;

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.update.mockResolvedValue(undefined);

      const input = { id, url: 'https://new.com' };

      const result = await service.execute(input);

      expect(result.shortUrl.hash).toBe(hash);
      expect(result.shortUrl.clickCount).toBe(clickCountBeforeUpdate);
      expect(result.shortUrl.id).toBe(id);
    });
  });
});
