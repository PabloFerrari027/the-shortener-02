import { Test, TestingModule } from '@nestjs/testing';
import { ListShortnerUrlsService } from './list-shortner-urls.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { Order } from 'src/shared/types/pagination-options.type';

describe('ListShortnerUrlsService', () => {
  let service: ListShortnerUrlsService;
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
        ListShortnerUrlsService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockShortUrlRepository,
        },
      ],
    }).compile();

    service = module.get<ListShortnerUrlsService>(ListShortnerUrlsService);
    repository = module.get('ShortUrlRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should list short urls with pagination', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'abc123', url: 'https://example1.com' }),
        ShortUrl.create({ hash: 'def456', url: 'https://example2.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 5,
        currentPage: 1,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = { page: 1 };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledTimes(1);
      expect(repository.list).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual({
        data: mockShortUrls,
        currentPage: 1,
        totalPages: 5,
      });
    });

    it('should list short urls with orderBy parameter', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'abc123', url: 'https://example1.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 1,
        currentPage: 1,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = { page: 1, orderBy: 'createdAt' as const };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
      expect(result.data).toEqual(mockShortUrls);
    });

    it('should list short urls with order parameter', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'xyz789', url: 'https://test.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 2,
        currentPage: 2,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = { page: 2, order: 'DESC' as Order };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledWith({
        page: 2,
        order: 'DESC',
        orderBy: undefined,
      });
      expect(result.currentPage).toBe(2);
    });

    it('should list short urls with both orderBy and order parameters', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'aaa111', url: 'https://test1.com' }),
        ShortUrl.create({ hash: 'bbb222', url: 'https://test2.com' }),
        ShortUrl.create({ hash: 'ccc333', url: 'https://test3.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 10,
        currentPage: 3,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = {
        page: 3,
        orderBy: 'clickCount' as const,
        order: 'ASC' as Order,
      };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledWith({
        page: 3,
        order: 'ASC',
        orderBy: 'clickCount',
      });
      expect(result).toEqual({
        data: mockShortUrls,
        currentPage: 3,
        totalPages: 10,
      });
    });

    it('should handle empty list', async () => {
      const mockResponse = {
        data: [],
        totalPages: 0,
        currentPage: 1,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = { page: 1 };

      const result = await service.execute(input);

      expect(result).toEqual({
        data: [],
        currentPage: 1,
        totalPages: 0,
      });
    });

    it('should handle different page numbers', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'page10', url: 'https://page10.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 15,
        currentPage: 10,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = { page: 10 };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledWith({
        page: 10,
        order: undefined,
        orderBy: undefined,
      });
      expect(result.currentPage).toBe(10);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      repository.list.mockRejectedValue(error);

      const input = { page: 1 };

      await expect(service.execute(input)).rejects.toThrow(
        'Database connection failed',
      );
      expect(repository.list).toHaveBeenCalledTimes(1);
    });

    it('should list with orderBy updatedAt', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'recent', url: 'https://recent.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 1,
        currentPage: 1,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = {
        page: 1,
        orderBy: 'updatedAt' as const,
        order: 'DESC' as Order,
      };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledWith({
        page: 1,
        order: 'DESC',
        orderBy: 'updatedAt',
      });
      expect(result.data).toEqual(mockShortUrls);
    });

    it('should list with orderBy url', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'url1', url: 'https://aaa.com' }),
        ShortUrl.create({ hash: 'url2', url: 'https://bbb.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 1,
        currentPage: 1,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = {
        page: 1,
        orderBy: 'url' as const,
        order: 'ASC' as Order,
      };

      const result = await service.execute(input);

      expect(repository.list).toHaveBeenCalledWith({
        page: 1,
        order: 'ASC',
        orderBy: 'url',
      });
      expect(result.totalPages).toBe(1);
    });

    it('should return correct structure with all fields', async () => {
      const mockShortUrls = [
        ShortUrl.create({ hash: 'test', url: 'https://test.com' }),
      ];

      const mockResponse = {
        data: mockShortUrls,
        totalPages: 3,
        currentPage: 2,
      };

      repository.list.mockResolvedValue(mockResponse);

      const input = { page: 2 };

      const result = await service.execute(input);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.currentPage).toBe('number');
      expect(typeof result.totalPages).toBe('number');
    });
  });
});
