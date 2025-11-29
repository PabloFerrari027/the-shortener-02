import { Test, TestingModule } from '@nestjs/testing';
import { UpdateShortUrlService } from './update-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { NotAllowedError } from '@/modules/auth/domain/erros/not-allowed.error';
import { Bus } from '@/shared/domain-events/bus';

jest.mock('@/shared/domain-events/bus');

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
    describe('successful update', () => {
      it('should find short url by id, update url and save it', async () => {
        const userId = 'user-123';
        const oldUrl = 'https://old-url.com';
        const newUrl = 'https://new-url.com';

        const mockShortUrl = ShortUrl.create({
          hash: 'abc123',
          url: oldUrl,
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = { id: mockShortUrl.id, url: newUrl, userId };

        const result = await service.execute(input);

        expect(repository.findById).toHaveBeenCalledTimes(1);
        expect(repository.findById).toHaveBeenCalledWith(mockShortUrl.id);
        expect(repository.update).toHaveBeenCalledTimes(1);
        expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
        expect(result.shortUrl).toBe(mockShortUrl);
        expect(result.shortUrl.url).toBe(newUrl);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should update the updatedAt timestamp when url is changed', async () => {
        const userId = 'user-456';
        const mockShortUrl = ShortUrl.create({
          hash: 'xyz789',
          url: 'https://original.com',
          userId,
        });

        const initialUpdatedAt = mockShortUrl.updatedAt;

        await new Promise((resolve) => setTimeout(resolve, 10));

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        const result = await service.execute(input);

        expect(result.shortUrl.updatedAt.getTime()).toBeGreaterThan(
          initialUpdatedAt.getTime(),
        );
      });

      it('should successfully update to a different valid url', async () => {
        const userId = 'user-different';
        const mockShortUrl = ShortUrl.create({
          hash: 'diff123',
          url: 'https://example.com/path1',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const newUrl = 'https://different-domain.org/path2?query=param';
        const input = { id: mockShortUrl.id, url: newUrl, userId };

        const result = await service.execute(input);

        expect(result.shortUrl.url).toBe(newUrl);
        expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
      });

      it('should return the same ShortUrl instance that was updated', async () => {
        const userId = 'user-same';
        const mockShortUrl = ShortUrl.create({
          hash: 'same123',
          url: 'https://original.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        const result = await service.execute(input);

        expect(result.shortUrl).toBe(mockShortUrl);
        expect(result.shortUrl.id).toBe(mockShortUrl.id);
      });

      it('should preserve other properties when updating url', async () => {
        const userId = 'user-preserve';
        const hash = 'preserve123';
        const mockShortUrl = ShortUrl.create({
          hash,
          url: 'https://original.com',
          userId,
        });

        mockShortUrl.incrementClickCount();
        const clickCountBeforeUpdate = mockShortUrl.clickCount;

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = { id: mockShortUrl.id, url: 'https://new.com', userId };

        const result = await service.execute(input);

        expect(result.shortUrl.hash).toBe(hash);
        expect(result.shortUrl.clickCount).toBe(clickCountBeforeUpdate);
        expect(result.shortUrl.id).toBe(mockShortUrl.id);
      });
    });

    describe('ShortUrl not found', () => {
      it('should throw ShortUrlNotFoundError when id does not exist', async () => {
        const nonExistentId = 'non-existent-id';
        const userId = 'user-123';
        repository.findById.mockResolvedValue(null);

        const input = { id: nonExistentId, url: 'https://test.com', userId };

        await expect(service.execute(input)).rejects.toThrow(
          ShortUrlNotFoundError,
        );
        await expect(service.execute(input)).rejects.toThrow(nonExistentId);
        expect(repository.findById).toHaveBeenCalledWith(nonExistentId);
        expect(repository.update).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should throw ShortUrlNotFoundError with correct id in error message', async () => {
        const id = 'missing-id-789';
        const userId = 'user-123';
        repository.findById.mockResolvedValue(null);

        const input = { id, url: 'https://test.com', userId };

        try {
          await service.execute(input);
          fail('Should have thrown ShortUrlNotFoundError');
        } catch (err) {
          const error = err as Error;
          expect(error).toBeInstanceOf(ShortUrlNotFoundError);
          expect(error.message).toContain(id);
        }
      });
    });

    describe('authorization', () => {
      it('should throw NotAllowedError when userId does not match', async () => {
        const shortUrlId = 'short-url-123';
        const ownerId = 'owner-123';
        const differentUserId = 'different-user-456';

        const mockShortUrl = ShortUrl.create({
          hash: 'owned123',
          url: 'https://owned.com',
          userId: ownerId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        const input = {
          id: shortUrlId,
          url: 'https://updated.com',
          userId: differentUserId,
        };

        await expect(service.execute(input)).rejects.toThrow(NotAllowedError);

        expect(repository.findById).toHaveBeenCalledWith(shortUrlId);
        expect(repository.update).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should throw NotAllowedError when trying to update someone elses ShortUrl', async () => {
        const mockShortUrl = ShortUrl.create({
          hash: 'other123',
          url: 'https://other.com',
          userId: 'owner-abc',
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        const input = {
          id: mockShortUrl.id,
          url: 'https://hacked.com',
          userId: 'attacker-xyz',
        };

        await expect(service.execute(input)).rejects.toThrow(NotAllowedError);

        expect(repository.update).not.toHaveBeenCalled();
      });

      it('should allow update when userId matches exactly', async () => {
        const userId = 'exact-match-user';
        const mockShortUrl = ShortUrl.create({
          hash: 'exact123',
          url: 'https://exact.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        await expect(service.execute(input)).resolves.not.toThrow();

        expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
      });

      it('should throw NotAllowedError when ShortUrl has userId but input userId is undefined', async () => {
        const mockShortUrl = ShortUrl.create({
          hash: 'hasowner',
          url: 'https://hasowner.com',
          userId: 'owner-123',
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId: undefined as any,
        };

        await expect(service.execute(input)).rejects.toThrow(NotAllowedError);
      });
    });

    describe('domain events', () => {
      it('should dispatch ShortUrlChangedEvent after updating', async () => {
        const userId = 'user-event';
        const mockShortUrl = ShortUrl.create({
          hash: 'event123',
          url: 'https://original.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        await service.execute(input);

        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
        const dispatchedEvents = (Bus.dispatch as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(dispatchedEvents)).toBe(true);
        expect(dispatchedEvents.length).toBeGreaterThan(0);
      });

      it('should pull events from entity before dispatching', async () => {
        const userId = 'user-pull';
        const mockShortUrl = ShortUrl.create({
          hash: 'pull123',
          url: 'https://original.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        const result = await service.execute(input);

        // Após pullEvents, a entidade não deve ter mais eventos
        expect(result.shortUrl.pullEvents()).toEqual([]);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should dispatch events after repository update', async () => {
        const userId = 'user-order';
        const mockShortUrl = ShortUrl.create({
          hash: 'order123',
          url: 'https://original.com',
          userId,
        });

        const callOrder: string[] = [];

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockImplementation(async () => {
          callOrder.push('update');
        });
        (Bus.dispatch as jest.Mock).mockImplementation(async () => {
          callOrder.push('dispatch');
        });

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        await service.execute(input);

        expect(callOrder).toEqual(['update', 'dispatch']);
      });
    });

    describe('url validation', () => {
      it('should throw error when url is empty string', async () => {
        const userId = 'user-invalid';
        const mockShortUrl = ShortUrl.create({
          hash: 'valid123',
          url: 'https://valid.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        const input = { id: mockShortUrl.id, url: '', userId };

        await expect(service.execute(input)).rejects.toThrow();
        expect(repository.update).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should throw error when url is only whitespace', async () => {
        const userId = 'user-whitespace';
        const mockShortUrl = ShortUrl.create({
          hash: 'valid456',
          url: 'https://valid.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        const input = { id: mockShortUrl.id, url: '   ', userId };

        await expect(service.execute(input)).rejects.toThrow();
        expect(repository.update).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should propagate repository findById errors', async () => {
        const id = 'error-id';
        const userId = 'user-123';
        const error = new Error('Database connection failed');
        repository.findById.mockRejectedValue(error);

        const input = { id, url: 'https://test.com', userId };

        await expect(service.execute(input)).rejects.toThrow(
          'Database connection failed',
        );
        expect(repository.update).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should propagate repository update errors', async () => {
        const userId = 'user-update-error';
        const mockShortUrl = ShortUrl.create({
          hash: 'abc123',
          url: 'https://old.com',
          userId,
        });

        const error = new Error('Failed to update');
        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockRejectedValue(error);

        const input = { id: mockShortUrl.id, url: 'https://new.com', userId };

        await expect(service.execute(input)).rejects.toThrow(
          'Failed to update',
        );
        expect(repository.findById).toHaveBeenCalledWith(mockShortUrl.id);
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should not dispatch events if update fails', async () => {
        const userId = 'user-fail';
        const mockShortUrl = ShortUrl.create({
          hash: 'fail123',
          url: 'https://fail.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockRejectedValue(new Error('Update failed'));
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        await expect(service.execute(input)).rejects.toThrow();

        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should not update if authorization fails', async () => {
        const mockShortUrl = ShortUrl.create({
          hash: 'auth-fail',
          url: 'https://authfail.com',
          userId: 'owner-123',
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        const input = {
          id: mockShortUrl.id,
          url: 'https://hacked.com',
          userId: 'attacker-456',
        };

        await expect(service.execute(input)).rejects.toThrow(NotAllowedError);

        expect(repository.update).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
        // URL não deve ter sido alterada
        expect(mockShortUrl.url).toBe('https://authfail.com');
      });
    });

    describe('edge cases', () => {
      it('should handle ShortUrl with high click count', async () => {
        const userId = 'user-clicks';
        const mockShortUrl = ShortUrl.create({
          hash: 'popular',
          url: 'https://popular.com',
          userId,
        });

        for (let i = 0; i < 1000; i++) {
          mockShortUrl.incrementClickCount();
        }

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = {
          id: mockShortUrl.id,
          url: 'https://updated.com',
          userId,
        };

        const result = await service.execute(input);

        expect(result.shortUrl.clickCount).toBe(1000);
        expect(result.shortUrl.url).toBe('https://updated.com');
      });

      it('should handle updating to same url', async () => {
        const userId = 'user-same-url';
        const sameUrl = 'https://same.com';
        const mockShortUrl = ShortUrl.create({
          hash: 'same-url',
          url: sameUrl,
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = { id: mockShortUrl.id, url: sameUrl, userId };

        const result = await service.execute(input);

        expect(result.shortUrl.url).toBe(sameUrl);
        expect(repository.update).toHaveBeenCalledWith(mockShortUrl);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should handle long URLs', async () => {
        const userId = 'user-long-url';
        const mockShortUrl = ShortUrl.create({
          hash: 'long',
          url: 'https://short.com',
          userId,
        });

        const longUrl = 'https://example.com/' + 'a'.repeat(2000);

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.update.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const input = { id: mockShortUrl.id, url: longUrl, userId };

        const result = await service.execute(input);

        expect(result.shortUrl.url).toBe(longUrl);
        expect(result.shortUrl.url.length).toBeGreaterThan(2000);
      });
    });
  });
});
