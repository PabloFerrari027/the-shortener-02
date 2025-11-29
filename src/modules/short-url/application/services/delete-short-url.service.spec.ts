import { Test, TestingModule } from '@nestjs/testing';
import { DeleteShortUrlService } from './delete-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { NotAllowedError } from '@/modules/auth/domain/erros/not-allowed.error';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { Bus } from '@/shared/domain-events/bus';

jest.mock('@/shared/domain-events/bus');

describe('DeleteShortUrlService', () => {
  let service: DeleteShortUrlService;
  let repository: jest.Mocked<ShortUrlRepository>;

  const mockRepository: jest.Mocked<ShortUrlRepository> = {
    create: jest.fn(),
    findByHash: jest.fn(),
    findById: jest.fn(),
    listByUserId: jest.fn(),
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
    describe('successful deletion', () => {
      it('should delete a ShortUrl when it exists and userId matches', async () => {
        const shortUrlId = 'valid-uuid-123';
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'abc123',
          url: 'https://example.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: shortUrlId, userId });

        expect(repository.findById).toHaveBeenCalledTimes(1);
        expect(repository.findById).toHaveBeenCalledWith(shortUrlId);
        expect(repository.delete).toHaveBeenCalledTimes(1);
        expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should call remove() on ShortUrl entity before dispatching events', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'test123',
          url: 'https://test.com',
          userId,
        });

        const removeSpy = jest.spyOn(mockShortUrl, 'remove');
        const pullEventsSpy = jest.spyOn(mockShortUrl, 'pullEvents');

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: mockShortUrl.id, userId });

        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(pullEventsSpy).toHaveBeenCalledTimes(1);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should dispatch ShortUrlRemovedEvent', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'event123',
          url: 'https://event.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: mockShortUrl.id, userId });

        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
        const dispatchedEvents = (Bus.dispatch as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(dispatchedEvents)).toBe(true);
        expect(dispatchedEvents.length).toBeGreaterThan(0);
      });

      it('should return void when deletion is successful', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'void123',
          url: 'https://void.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ id: mockShortUrl.id, userId });

        expect(result).toBeUndefined();
      });
    });

    describe('ShortUrl not found', () => {
      it('should throw ShortUrlNotFoundError when ShortUrl does not exist', async () => {
        const nonExistentId = 'non-existent-id';
        const userId = 'user-123';

        repository.findById.mockResolvedValue(null);

        await expect(
          service.execute({ id: nonExistentId, userId }),
        ).rejects.toThrow(ShortUrlNotFoundError);

        expect(repository.findById).toHaveBeenCalledTimes(1);
        expect(repository.findById).toHaveBeenCalledWith(nonExistentId);
        expect(repository.delete).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should throw ShortUrlNotFoundError with correct id in error message', async () => {
        const nonExistentId = 'specific-id-456';
        const userId = 'user-123';
        repository.findById.mockResolvedValue(null);

        try {
          await service.execute({ id: nonExistentId, userId });
          fail('Should have thrown ShortUrlNotFoundError');
        } catch (error) {
          expect(error).toBeInstanceOf(ShortUrlNotFoundError);
          expect((error as ShortUrlNotFoundError).message).toContain(
            nonExistentId,
          );
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

        await expect(
          service.execute({ id: shortUrlId, userId: differentUserId }),
        ).rejects.toThrow(NotAllowedError);

        expect(repository.findById).toHaveBeenCalledWith(shortUrlId);
        expect(repository.delete).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should throw NotAllowedError when trying to delete someone elses ShortUrl', async () => {
        const mockShortUrl = ShortUrl.create({
          hash: 'other123',
          url: 'https://other.com',
          userId: 'owner-abc',
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        await expect(
          service.execute({ id: mockShortUrl.id, userId: 'attacker-xyz' }),
        ).rejects.toThrow(NotAllowedError);

        expect(repository.delete).not.toHaveBeenCalled();
      });

      it('should allow deletion when userId matches exactly', async () => {
        const userId = 'exact-match-user';
        const mockShortUrl = ShortUrl.create({
          hash: 'exact123',
          url: 'https://exact.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await expect(
          service.execute({ id: mockShortUrl.id, userId }),
        ).resolves.not.toThrow();

        expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
      });

      it('should throw NotAllowedError when ShortUrl has userId but input userId is undefined', async () => {
        const mockShortUrl = ShortUrl.create({
          hash: 'hasowner',
          url: 'https://hasowner.com',
          userId: 'owner-123',
        });

        repository.findById.mockResolvedValue(mockShortUrl);

        await expect(
          service.execute({ id: mockShortUrl.id, userId: undefined as any }),
        ).rejects.toThrow(NotAllowedError);
      });
    });

    describe('error handling', () => {
      it('should propagate repository findById errors', async () => {
        const repositoryError = new Error('Database connection failed');
        repository.findById.mockRejectedValue(repositoryError);

        await expect(
          service.execute({ id: 'any-id', userId: 'user-123' }),
        ).rejects.toThrow('Database connection failed');

        expect(repository.delete).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should propagate repository delete errors', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'error123',
          url: 'https://error.com',
          userId,
        });
        const deleteError = new Error('Failed to delete from database');

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockRejectedValue(deleteError);

        await expect(
          service.execute({ id: mockShortUrl.id, userId }),
        ).rejects.toThrow('Failed to delete from database');

        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should not dispatch events if delete fails', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'faildelete',
          url: 'https://faildelete.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockRejectedValue(new Error('Delete failed'));
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await expect(
          service.execute({ id: mockShortUrl.id, userId }),
        ).rejects.toThrow();

        expect(Bus.dispatch).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle empty string id', async () => {
        repository.findById.mockResolvedValue(null);

        await expect(
          service.execute({ id: '', userId: 'user-123' }),
        ).rejects.toThrow(ShortUrlNotFoundError);

        expect(repository.findById).toHaveBeenCalledWith('');
      });

      it('should delete ShortUrl with multiple clicks', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'popular',
          url: 'https://popular.com',
          userId,
        });

        for (let i = 0; i < 100; i++) {
          mockShortUrl.incrementClickCount();
        }

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: mockShortUrl.id, userId });

        expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
        expect(mockShortUrl.clickCount).toBe(100);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should delete ShortUrl with updated url', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'updated',
          url: 'https://original.com',
          userId,
        });

        mockShortUrl.url = 'https://updated.com';

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: mockShortUrl.id, userId });

        expect(repository.delete).toHaveBeenCalledWith(mockShortUrl.id);
        expect(mockShortUrl.url).toBe('https://updated.com');
      });

      it('should accept valid UUID format', async () => {
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'uuid',
          url: 'https://uuid.com',
          userId,
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: validUUID, userId });

        expect(repository.findById).toHaveBeenCalledWith(validUUID);
      });
    });

    describe('event ordering', () => {
      it('should call remove before pullEvents', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'order123',
          url: 'https://order.com',
          userId,
        });

        const callOrder: string[] = [];
        const originalRemove = mockShortUrl.remove.bind(mockShortUrl);
        const originalPullEvents = mockShortUrl.pullEvents.bind(mockShortUrl);

        mockShortUrl.remove = jest.fn(() => {
          callOrder.push('remove');
          return originalRemove();
        });

        mockShortUrl.pullEvents = jest.fn(() => {
          callOrder.push('pullEvents');
          return originalPullEvents();
        });

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ id: mockShortUrl.id, userId });

        expect(callOrder).toEqual(['remove', 'pullEvents']);
      });

      it('should delete from repository before dispatching events', async () => {
        const userId = 'user-123';
        const mockShortUrl = ShortUrl.create({
          hash: 'deleteorder',
          url: 'https://deleteorder.com',
          userId,
        });

        const callOrder: string[] = [];

        repository.findById.mockResolvedValue(mockShortUrl);
        repository.delete.mockImplementation(async () => {
          callOrder.push('delete');
        });
        (Bus.dispatch as jest.Mock).mockImplementation(async () => {
          callOrder.push('dispatch');
        });

        await service.execute({ id: mockShortUrl.id, userId });

        expect(callOrder).toEqual(['delete', 'dispatch']);
      });
    });
  });
});
