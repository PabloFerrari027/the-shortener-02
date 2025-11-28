import { Test, TestingModule } from '@nestjs/testing';
import { CreateShortUrlService } from './create-short-url.service';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { ShortUrl } from '../../domain/entities/short-url.entity';

describe('CreateShortUrlService', () => {
  let service: CreateShortUrlService;
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
        CreateShortUrlService,
        {
          provide: 'ShortUrlRepository',
          useValue: mockShortUrlRepository,
        },
      ],
    }).compile();

    service = module.get<CreateShortUrlService>(CreateShortUrlService);
    repository = module.get('ShortUrlRepository');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should create a short url with the correct hash based on count', async () => {
      const currentCount = 10;
      const inputUrl = 'https://example.com/very-long-url';
      const expectedHash = ShortUrl.generateHash(currentCount + 1);

      repository.count.mockResolvedValue(currentCount);
      repository.create.mockResolvedValue(undefined);

      const result = await service.execute({ url: inputUrl });

      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(result.shortUrl).toBeInstanceOf(ShortUrl);
      expect(result.shortUrl.hash).toBe(expectedHash);
      expect(result.shortUrl.url).toBe(inputUrl);
      expect(result.shortUrl.clickCount).toBe(0);
    });

    it('should create a short url when count is 0', async () => {
      const currentCount = 0;
      const inputUrl = 'https://example.com';
      const expectedHash = ShortUrl.generateHash(1);

      repository.count.mockResolvedValue(currentCount);
      repository.create.mockResolvedValue(undefined);

      const result = await service.execute({ url: inputUrl });

      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(result.shortUrl.hash).toBe(expectedHash);
      expect(result.shortUrl.url).toBe(inputUrl);
    });

    it('should create a short url with large count value', async () => {
      const currentCount = 999999;
      const inputUrl = 'https://example.com/test';
      const expectedHash = ShortUrl.generateHash(currentCount + 1);

      repository.count.mockResolvedValue(currentCount);
      repository.create.mockResolvedValue(undefined);

      const result = await service.execute({ url: inputUrl });

      expect(result.shortUrl.hash).toBe(expectedHash);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: expectedHash,
          url: inputUrl,
        }),
      );
    });

    it('should pass the created ShortUrl entity to repository', async () => {
      const inputUrl = 'https://test.com';
      repository.count.mockResolvedValue(5);
      repository.create.mockResolvedValue(undefined);

      await service.execute({ url: inputUrl });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: inputUrl,
          clickCount: 0,
        }),
      );

      const createdEntity = repository.create.mock.calls[0][0];
      expect(createdEntity).toBeInstanceOf(ShortUrl);
      expect(createdEntity.id).toBeDefined();
      expect(createdEntity.createdAt).toBeInstanceOf(Date);
      expect(createdEntity.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if url is invalid', async () => {
      const invalidUrl = '';
      repository.count.mockResolvedValue(1);

      await expect(service.execute({ url: invalidUrl })).rejects.toThrow();
    });

    it('should propagate repository errors', async () => {
      const inputUrl = 'https://example.com';
      const error = new Error('Database connection failed');
      repository.count.mockRejectedValue(error);

      await expect(service.execute({ url: inputUrl })).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate repository create errors', async () => {
      const inputUrl = 'https://example.com';
      const error = new Error('Failed to create');
      repository.count.mockResolvedValue(1);
      repository.create.mockRejectedValue(error);

      await expect(service.execute({ url: inputUrl })).rejects.toThrow(
        'Failed to create',
      );
    });
  });
});
