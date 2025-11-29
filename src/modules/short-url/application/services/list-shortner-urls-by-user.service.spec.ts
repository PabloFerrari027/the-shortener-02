import { Test, TestingModule } from '@nestjs/testing';
import { ListShortnerUrlsByUserService } from './list-shortner-urls-by-user.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { Order } from '@/shared/types/pagination-options.type';

describe('ListShortnerUrlsByUserService', () => {
  let service: ListShortnerUrlsByUserService;
  let repository: jest.Mocked<ShortUrlRepository>;

  const mockShortUrlRepository = {
    count: jest.fn(),
    create: jest.fn(),
    findByHash: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    listByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListShortnerUrlsByUserService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockShortUrlRepository,
        },
      ],
    }).compile();

    service = module.get<ListShortnerUrlsByUserService>(
      ListShortnerUrlsByUserService,
    );
    repository = module.get('ShortUrlRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    describe('basic listing', () => {
      it('should list short urls for a specific user', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'abc123',
            url: 'https://example1.com',
            userId,
          }),
          ShortUrl.create({
            hash: 'def456',
            url: 'https://example2.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(repository.listByUserId).toHaveBeenCalledTimes(1);
        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: undefined,
          orderBy: undefined,
        });
        expect(result.data).toEqual(mockShortUrls);
        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBe(1);
      });

      it('should return empty array when user has no short urls', async () => {
        const userId = 'user-no-urls';
        const page = 1;

        const mockResponse = {
          data: [],
          currentPage: 1,
          totalPages: 0,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.data).toEqual([]);
        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBe(0);
      });

      it('should handle first page correctly', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'page1',
            url: 'https://page1.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 5,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.currentPage).toBe(1);
        expect(result.totalPages).toBe(5);
      });

      it('should handle middle page correctly', async () => {
        const userId = 'user-123';
        const page = 3;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'page3',
            url: 'https://page3.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 3,
          totalPages: 5,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.currentPage).toBe(3);
        expect(result.totalPages).toBe(5);
      });

      it('should handle last page correctly', async () => {
        const userId = 'user-123';
        const page = 5;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'last',
            url: 'https://last.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 5,
          totalPages: 5,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.currentPage).toBe(5);
        expect(result.totalPages).toBe(5);
      });
    });

    describe('ordering', () => {
      it('should list short urls ordered by createdAt ascending', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'old',
            url: 'https://old.com',
            userId,
          }),
          ShortUrl.create({
            hash: 'new',
            url: 'https://new.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({
          userId,
          page,
          orderBy: 'createdAt',
          order: Order.ASC,
        });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.ASC,
          orderBy: 'createdAt',
        });
        expect(result.data).toEqual(mockShortUrls);
      });

      it('should list short urls ordered by createdAt descending', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'new',
            url: 'https://new.com',
            userId,
          }),
          ShortUrl.create({
            hash: 'old',
            url: 'https://old.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({
          userId,
          page,
          orderBy: 'createdAt',
          order: Order.DESC,
        });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.DESC,
          orderBy: 'createdAt',
        });
        expect(result.data).toEqual(mockShortUrls);
      });

      it('should list short urls ordered by clickCount', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'popular',
            url: 'https://popular.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({
          userId,
          page,
          orderBy: 'clickCount',
          order: Order.DESC,
        });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.DESC,
          orderBy: 'clickCount',
        });
      });

      it('should list short urls ordered by url', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'a',
            url: 'https://a.com',
            userId,
          }),
          ShortUrl.create({
            hash: 'z',
            url: 'https://z.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({
          userId,
          page,
          orderBy: 'url',
          order: Order.ASC,
        });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.ASC,
          orderBy: 'url',
        });
      });

      it('should list short urls ordered by hash', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'aaa',
            url: 'https://first.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({
          userId,
          page,
          orderBy: 'hash',
          order: Order.ASC,
        });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.ASC,
          orderBy: 'hash',
        });
      });

      it('should list short urls ordered by updatedAt', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'recent',
            url: 'https://recent.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({
          userId,
          page,
          orderBy: 'updatedAt',
          order: Order.DESC,
        });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.DESC,
          orderBy: 'updatedAt',
        });
      });
    });

    describe('pagination', () => {
      it('should handle multiple pages of results', async () => {
        const userId = 'user-many-urls';

        // Page 1
        const mockResponse1 = {
          data: [
            ShortUrl.create({
              hash: 'url1',
              url: 'https://url1.com',
              userId,
            }),
          ],
          currentPage: 1,
          totalPages: 3,
        };

        repository.listByUserId.mockResolvedValue(mockResponse1);

        const result1 = await service.execute({ userId, page: 1 });

        expect(result1.currentPage).toBe(1);
        expect(result1.totalPages).toBe(3);

        // Page 2
        const mockResponse2 = {
          data: [
            ShortUrl.create({
              hash: 'url2',
              url: 'https://url2.com',
              userId,
            }),
          ],
          currentPage: 2,
          totalPages: 3,
        };

        repository.listByUserId.mockResolvedValue(mockResponse2);

        const result2 = await service.execute({ userId, page: 2 });

        expect(result2.currentPage).toBe(2);
        expect(result2.totalPages).toBe(3);
      });

      it('should pass correct page number to repository', async () => {
        const userId = 'user-123';
        const page = 10;

        const mockResponse = {
          data: [],
          currentPage: 10,
          totalPages: 15,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({ userId, page });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page: 10,
          order: undefined,
          orderBy: undefined,
        });
      });
    });

    describe('output mapping', () => {
      it('should return correct output structure', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'test',
            url: 'https://test.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('currentPage');
        expect(result).toHaveProperty('totalPages');
        expect(Array.isArray(result.data)).toBe(true);
        expect(typeof result.currentPage).toBe('number');
        expect(typeof result.totalPages).toBe('number');
      });

      it('should preserve ShortUrl entity instances in data', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'entity1',
            url: 'https://entity1.com',
            userId,
          }),
          ShortUrl.create({
            hash: 'entity2',
            url: 'https://entity2.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        result.data.forEach((item) => {
          expect(item).toBeInstanceOf(ShortUrl);
        });
      });

      it('should map repository response to output format', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockResponse = {
          data: [],
          currentPage: 5,
          totalPages: 10,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result).toEqual({
          data: [],
          currentPage: 5,
          totalPages: 10,
        });
      });
    });

    describe('error handling', () => {
      it('should propagate repository errors', async () => {
        const userId = 'user-123';
        const page = 1;
        const error = new Error('Database connection failed');

        repository.listByUserId.mockRejectedValue(error);

        await expect(service.execute({ userId, page })).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should handle repository timeout errors', async () => {
        const userId = 'user-123';
        const page = 1;
        const error = new Error('Query timeout');

        repository.listByUserId.mockRejectedValue(error);

        await expect(service.execute({ userId, page })).rejects.toThrow(
          'Query timeout',
        );
      });

      it('should handle invalid page numbers gracefully', async () => {
        const userId = 'user-123';
        const page = -1;

        repository.listByUserId.mockResolvedValue({
          data: [],
          currentPage: 1,
          totalPages: 0,
        });

        await service.execute({ userId, page });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page: -1,
          order: undefined,
          orderBy: undefined,
        });
      });
    });

    describe('edge cases', () => {
      it('should handle user with single short url', async () => {
        const userId = 'user-single';
        const page = 1;

        const mockShortUrls = [
          ShortUrl.create({
            hash: 'only',
            url: 'https://only.com',
            userId,
          }),
        ];

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.data).toHaveLength(1);
        expect(result.totalPages).toBe(1);
      });

      it('should handle user with many short urls', async () => {
        const userId = 'user-many';
        const page = 1;

        const mockShortUrls = Array.from({ length: 50 }, (_, i) =>
          ShortUrl.create({
            hash: `hash${i}`,
            url: `https://url${i}.com`,
            userId,
          }),
        );

        const mockResponse = {
          data: mockShortUrls,
          currentPage: 1,
          totalPages: 5,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.data).toHaveLength(50);
        expect(result.totalPages).toBe(5);
      });

      it('should handle different user ids', async () => {
        const userId1 = 'user-aaa';
        const userId2 = 'user-bbb';

        const mockResponse1 = {
          data: [
            ShortUrl.create({
              hash: 'user1',
              url: 'https://user1.com',
              userId: userId1,
            }),
          ],
          currentPage: 1,
          totalPages: 1,
        };

        const mockResponse2 = {
          data: [
            ShortUrl.create({
              hash: 'user2',
              url: 'https://user2.com',
              userId: userId2,
            }),
          ],
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValueOnce(mockResponse1);
        repository.listByUserId.mockResolvedValueOnce(mockResponse2);

        const result1 = await service.execute({ userId: userId1, page: 1 });
        const result2 = await service.execute({ userId: userId2, page: 1 });

        expect(result1.data[0].userId).toBe(userId1);
        expect(result2.data[0].userId).toBe(userId2);
      });

      it('should handle page beyond total pages', async () => {
        const userId = 'user-123';
        const page = 100;

        const mockResponse = {
          data: [],
          currentPage: 100,
          totalPages: 5,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.data).toEqual([]);
        expect(result.currentPage).toBe(100);
        expect(result.totalPages).toBe(5);
      });

      it('should handle short urls with high click counts', async () => {
        const userId = 'user-popular';
        const page = 1;

        const mockShortUrl = ShortUrl.create({
          hash: 'viral',
          url: 'https://viral.com',
          userId,
        });

        for (let i = 0; i < 10000; i++) {
          mockShortUrl.incrementClickCount();
        }

        const mockResponse = {
          data: [mockShortUrl],
          currentPage: 1,
          totalPages: 1,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        const result = await service.execute({ userId, page });

        expect(result.data[0].clickCount).toBe(10000);
      });
    });

    describe('optional parameters', () => {
      it('should work without orderBy parameter', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockResponse = {
          data: [],
          currentPage: 1,
          totalPages: 0,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({ userId, page, order: Order.ASC });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: Order.ASC,
          orderBy: undefined,
        });
      });

      it('should work without order parameter', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockResponse = {
          data: [],
          currentPage: 1,
          totalPages: 0,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({ userId, page, orderBy: 'createdAt' });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: undefined,
          orderBy: 'createdAt',
        });
      });

      it('should work with only required parameters', async () => {
        const userId = 'user-123';
        const page = 1;

        const mockResponse = {
          data: [],
          currentPage: 1,
          totalPages: 0,
        };

        repository.listByUserId.mockResolvedValue(mockResponse);

        await service.execute({ userId, page });

        expect(repository.listByUserId).toHaveBeenCalledWith(userId, {
          page,
          order: undefined,
          orderBy: undefined,
        });
      });
    });
  });
});
