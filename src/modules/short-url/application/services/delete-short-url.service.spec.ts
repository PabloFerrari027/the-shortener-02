import { Test, TestingModule } from '@nestjs/testing';
import { DeleteShortUrlService } from './delete-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { ShortUrl } from '../../domain/entities/short-url.entity';

describe('DeleteShortUrlService', () => {
  let service: DeleteShortUrlService;
  let repository: jest.Mocked<ShortUrlRepository>;

  const mockRepository: jest.Mocked<ShortUrlRepository> = {
    create: jest.fn(),
    findByHash: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteShortUrlService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeleteShortUrlService>(DeleteShortUrlService);
    repository = module.get('ShortUrlRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should delete a ShortUrl when it exists', async () => {
      const shortUrlId = 'valid-uuid-123';
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: 'https://example.com',
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      await service.execute({ id: shortUrlId });

      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith(shortUrlId);
      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
    });

    it('should throw ShortUrlNotFoundError when ShortUrl does not exist', async () => {
      const nonExistentId = 'non-existent-id';

      repository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: nonExistentId })).rejects.toThrow(
        ShortUrlNotFoundError,
      );

      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith(nonExistentId);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw ShortUrlNotFoundError with correct id in error message', async () => {
      const nonExistentId = 'specific-id-456';
      repository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: nonExistentId })).rejects.toThrow(
        new ShortUrlNotFoundError(nonExistentId),
      );
    });

    it('should call delete with the correct ShortUrl id', async () => {
      const mockShortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });
      const shortUrlId = mockShortUrl.id;

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      await service.execute({ id: shortUrlId });

      expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
    });

    it('should not call delete when ShortUrl is not found', async () => {
      repository.findById.mockResolvedValue(null);

      try {
        await service.execute({ id: 'any-id' });
        // eslint-disable-next-line no-empty
      } catch {}

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should return void when deletion is successful', async () => {
      const mockShortUrl = ShortUrl.create({
        hash: 'void123',
        url: 'https://void.com',
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      const result = await service.execute({ id: 'some-id' });

      expect(result).toBeUndefined();
    });

    it('should handle repository errors gracefully', async () => {
      const repositoryError = new Error('Database connection failed');
      repository.findById.mockRejectedValue(repositoryError);

      await expect(service.execute({ id: 'any-id' })).rejects.toThrow(
        'Database connection failed',
      );

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should propagate delete repository errors', async () => {
      const mockShortUrl = ShortUrl.create({
        hash: 'error123',
        url: 'https://error.com',
      });
      const deleteError = new Error('Failed to delete from database');

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockRejectedValue(deleteError);

      await expect(service.execute({ id: mockShortUrl.id })).rejects.toThrow(
        'Failed to delete from database',
      );
    });
  });

  describe('dependency injection', () => {
    it('should inject ShortUrlRepository correctly', () => {
      expect(repository).toBeDefined();
      expect(repository.findById).toBeDefined();
      expect(repository.delete).toBeDefined();
    });

    it('should use the injected repository instance', async () => {
      const mockShortUrl = ShortUrl.create({
        hash: 'inject123',
        url: 'https://inject.com',
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      await service.execute({ id: 'test-id' });

      expect(repository.findById).toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string id', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: '' })).rejects.toThrow(
        ShortUrlNotFoundError,
      );

      expect(repository.findById).toHaveBeenCalledWith('');
    });

    it('should handle special characters in id', async () => {
      const specialId = 'id-with-special-chars-!@#$';
      repository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: specialId })).rejects.toThrow(
        ShortUrlNotFoundError,
      );

      expect(repository.findById).toHaveBeenCalledWith(specialId);
    });

    it('should handle very long id strings', async () => {
      const longId = 'a'.repeat(1000);
      repository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: longId })).rejects.toThrow(
        ShortUrlNotFoundError,
      );

      expect(repository.findById).toHaveBeenCalledWith(longId);
    });

    it('should delete ShortUrl with multiple clicks', async () => {
      const mockShortUrl = ShortUrl.create({
        hash: 'popular',
        url: 'https://popular.com',
      });

      for (let i = 0; i < 100; i++) {
        mockShortUrl.incrementClickCount();
      }

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      await service.execute({ id: mockShortUrl.id });

      expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
      expect(mockShortUrl.clickCount).toBe(100);
    });

    it('should delete ShortUrl with updated url', async () => {
      const mockShortUrl = ShortUrl.create({
        hash: 'updated',
        url: 'https://original.com',
      });

      mockShortUrl.url = 'https://updated.com';

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      await service.execute({ id: mockShortUrl.id });

      expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
      expect(mockShortUrl.url).toBe('https://updated.com');
    });
  });

  describe('input validation', () => {
    it('should accept valid UUID format', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const mockShortUrl = ShortUrl.create({
        hash: 'uuid',
        url: 'https://uuid.com',
      });

      repository.findById.mockResolvedValue(mockShortUrl);
      repository.delete.mockResolvedValue(undefined);

      await service.execute({ id: validUUID });

      expect(repository.findById).toHaveBeenCalledWith(validUUID);
    });

    it('should process input object with id property', async () => {
      const input = { id: 'test-id-123' };
      repository.findById.mockResolvedValue(null);

      await expect(service.execute(input)).rejects.toThrow(
        ShortUrlNotFoundError,
      );

      expect(repository.findById).toHaveBeenCalledWith(input.id);
    });
  });
});
