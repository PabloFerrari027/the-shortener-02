import { Test, TestingModule } from '@nestjs/testing';
import { CreateShortUrlService } from './create-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { Bus } from '@/shared/domain-events/bus';
import { UsersRepository } from '@/modules/users/domain/repositories/users.repository';
import { UserNotFoundError } from '@/modules/users/domain/errors/user-not-found.error';
import { User } from '@/modules/users/domain/entities/user.entity';

jest.mock('@/shared/domain-events/bus');

describe('CreateShortUrlService', () => {
  let service: CreateShortUrlService;
  let shortUrlRepository: jest.Mocked<ShortUrlRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;

  const mockShortUrlRepository = {
    count: jest.fn(),
    create: jest.fn(),
    findByHash: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateShortUrlService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockShortUrlRepository,
        },
        {
          provide: 'UsersRepository',
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<CreateShortUrlService>(CreateShortUrlService);
    shortUrlRepository = module.get('ShortUrlRepository');
    usersRepository = module.get('UsersRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    describe('without userId', () => {
      it('should create a short url with the correct hash based on count', async () => {
        const currentCount = 10;
        const inputUrl = 'https://example.com/very-long-url';
        const expectedHash = ShortUrl.generateHash(currentCount + 1);

        shortUrlRepository.count.mockResolvedValue(currentCount);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl });

        expect(shortUrlRepository.count).toHaveBeenCalledTimes(1);
        expect(shortUrlRepository.create).toHaveBeenCalledTimes(1);
        expect(result.shortUrl).toBeInstanceOf(ShortUrl);
        expect(result.shortUrl.hash).toBe(expectedHash);
        expect(result.shortUrl.url).toBe(inputUrl);
        expect(result.shortUrl.clickCount).toBe(0);
        expect(result.shortUrl.userId).toBeUndefined();
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should create a short url when count is 0', async () => {
        const currentCount = 0;
        const inputUrl = 'https://example.com';
        const expectedHash = ShortUrl.generateHash(1);

        shortUrlRepository.count.mockResolvedValue(currentCount);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl });

        expect(shortUrlRepository.count).toHaveBeenCalledTimes(1);
        expect(result.shortUrl.hash).toBe(expectedHash);
        expect(result.shortUrl.url).toBe(inputUrl);
        expect(result.shortUrl.userId).toBeUndefined();
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should create a short url with large count value', async () => {
        const currentCount = 999999;
        const inputUrl = 'https://example.com/test';
        const expectedHash = ShortUrl.generateHash(currentCount + 1);

        shortUrlRepository.count.mockResolvedValue(currentCount);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl });

        expect(result.shortUrl.hash).toBe(expectedHash);
        expect(shortUrlRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            hash: expectedHash,
            url: inputUrl,
          }),
        );
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should pass the created ShortUrl entity to repository with all properties', async () => {
        const inputUrl = 'https://test.com';
        shortUrlRepository.count.mockResolvedValue(5);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ url: inputUrl });

        expect(shortUrlRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            url: inputUrl,
            clickCount: 0,
          }),
        );

        const createdEntity = shortUrlRepository.create.mock.calls[0][0];
        expect(createdEntity).toBeInstanceOf(ShortUrl);
        expect(createdEntity.id).toBeDefined();
        expect(createdEntity.createdAt).toBeInstanceOf(Date);
        expect(createdEntity.updatedAt).toBeInstanceOf(Date);
        expect(createdEntity.userId).toBeUndefined();
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });
    });

    describe('with userId', () => {
      it('should create a short url with userId when user exists', async () => {
        const currentCount = 5;
        const inputUrl = 'https://example.com/user-url';
        const userId = 'user-123';
        const expectedHash = ShortUrl.generateHash(currentCount + 1);

        const mockUser = { id: userId, email: 'user@example.com' };
        usersRepository.findById.mockResolvedValue(mockUser as unknown as User);
        shortUrlRepository.count.mockResolvedValue(currentCount);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl, userId });

        expect(usersRepository.findById).toHaveBeenCalledWith(userId);
        expect(usersRepository.findById).toHaveBeenCalledTimes(1);
        expect(shortUrlRepository.count).toHaveBeenCalledTimes(1);
        expect(shortUrlRepository.create).toHaveBeenCalledTimes(1);
        expect(result.shortUrl).toBeInstanceOf(ShortUrl);
        expect(result.shortUrl.hash).toBe(expectedHash);
        expect(result.shortUrl.url).toBe(inputUrl);
        expect(result.shortUrl.userId).toBe(userId);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });

      it('should throw UserNotFoundError when userId is provided but user does not exist', async () => {
        const inputUrl = 'https://example.com';
        const userId = 'non-existent-user';

        usersRepository.findById.mockResolvedValue(null);

        await expect(
          service.execute({ url: inputUrl, userId }),
        ).rejects.toThrow(UserNotFoundError);

        expect(usersRepository.findById).toHaveBeenCalledWith(userId);
        expect(usersRepository.findById).toHaveBeenCalledTimes(1);
        expect(shortUrlRepository.count).not.toHaveBeenCalled();
        expect(shortUrlRepository.create).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should throw UserNotFoundError with correct userId', async () => {
        const inputUrl = 'https://example.com';
        const userId = 'specific-user-id';

        usersRepository.findById.mockResolvedValue(null);

        try {
          await service.execute({ url: inputUrl, userId });
          fail('Should have thrown UserNotFoundError');
        } catch (error) {
          expect(error).toBeInstanceOf(UserNotFoundError);
          expect((error as UserNotFoundError).message).toContain(userId);
        }

        expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      });
    });

    describe('domain events', () => {
      it('should dispatch ShortUrlCreatedEvent after creating short url', async () => {
        const inputUrl = 'https://example.com';

        shortUrlRepository.count.mockResolvedValue(1);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        await service.execute({ url: inputUrl });

        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
        const dispatchedEvents = (Bus.dispatch as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(dispatchedEvents)).toBe(true);
        expect(dispatchedEvents.length).toBeGreaterThan(0);
      });

      it('should pull events from entity before dispatching', async () => {
        const inputUrl = 'https://example.com';

        shortUrlRepository.count.mockResolvedValue(0);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl });

        // Após pullEvents, a entidade não deve ter mais eventos
        expect(result.shortUrl.pullEvents()).toEqual([]);
        expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      });
    });

    describe('error handling', () => {
      it('should throw error if url is empty string', async () => {
        const invalidUrl = '';
        shortUrlRepository.count.mockResolvedValue(1);

        await expect(service.execute({ url: invalidUrl })).rejects.toThrow();
        expect(shortUrlRepository.create).not.toHaveBeenCalled();
      });

      it('should throw error if url is only whitespace', async () => {
        const invalidUrl = '   ';
        shortUrlRepository.count.mockResolvedValue(1);

        await expect(service.execute({ url: invalidUrl })).rejects.toThrow();
        expect(shortUrlRepository.create).not.toHaveBeenCalled();
      });

      it('should propagate repository count errors', async () => {
        const inputUrl = 'https://example.com';
        const error = new Error('Database connection failed');
        shortUrlRepository.count.mockRejectedValue(error);

        await expect(service.execute({ url: inputUrl })).rejects.toThrow(
          'Database connection failed',
        );
        expect(shortUrlRepository.create).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should propagate repository create errors', async () => {
        const inputUrl = 'https://example.com';
        const error = new Error('Failed to create');
        shortUrlRepository.count.mockResolvedValue(1);
        shortUrlRepository.create.mockRejectedValue(error);

        await expect(service.execute({ url: inputUrl })).rejects.toThrow(
          'Failed to create',
        );
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should propagate user repository errors', async () => {
        const inputUrl = 'https://example.com';
        const userId = 'user-123';
        const error = new Error('User database error');
        usersRepository.findById.mockRejectedValue(error);

        await expect(
          service.execute({ url: inputUrl, userId }),
        ).rejects.toThrow('User database error');

        expect(usersRepository.findById).toHaveBeenCalledWith(userId);
        expect(shortUrlRepository.count).not.toHaveBeenCalled();
        expect(shortUrlRepository.create).not.toHaveBeenCalled();
        expect(Bus.dispatch).not.toHaveBeenCalled();
      });

      it('should not dispatch events if repository create fails', async () => {
        const inputUrl = 'https://example.com';
        shortUrlRepository.count.mockResolvedValue(1);
        shortUrlRepository.create.mockRejectedValue(new Error('Create failed'));

        await expect(service.execute({ url: inputUrl })).rejects.toThrow();

        expect(Bus.dispatch).not.toHaveBeenCalled();
      });
    });

    describe('entity validation', () => {
      it('should create entity with valid UUID', async () => {
        const inputUrl = 'https://example.com';
        shortUrlRepository.count.mockResolvedValue(0);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl });

        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(result.shortUrl.id).toMatch(uuidRegex);
      });

      it('should create entity with timestamps', async () => {
        const inputUrl = 'https://example.com';
        const beforeCreate = new Date();

        shortUrlRepository.count.mockResolvedValue(0);
        shortUrlRepository.create.mockResolvedValue(undefined);
        (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

        const result = await service.execute({ url: inputUrl });

        const afterCreate = new Date();

        expect(result.shortUrl.createdAt).toBeInstanceOf(Date);
        expect(result.shortUrl.updatedAt).toBeInstanceOf(Date);
        expect(result.shortUrl.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime(),
        );
        expect(result.shortUrl.createdAt.getTime()).toBeLessThanOrEqual(
          afterCreate.getTime(),
        );
      });
    });
  });
});
