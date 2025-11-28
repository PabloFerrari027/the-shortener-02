/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlController } from './short-url.controller';
import { CreateShortUrlService } from './services/create-short-url.service';
import { ListShortnerUrlsService } from './services/list-shortner-urls.service';
import { HandleShortUrlService } from './services/handle-short-url.service';
import { UpdateShortUrlService } from './services/update-short-url.service';
import { DeleteShortUrlService } from './services/delete-short-url.service';
import { ShortUrl } from '../domain/entities/short-url.entity';
import { ShortUrlPresentation } from './presentation/short-url.presentation';

describe('ShortUrlController', () => {
  let controller: ShortUrlController;
  let createShortUrlService: jest.Mocked<CreateShortUrlService>;
  let listShortnerUrlsService: jest.Mocked<ListShortnerUrlsService>;
  let handleShortUrlService: jest.Mocked<HandleShortUrlService>;
  let updateShortUrlService: jest.Mocked<UpdateShortUrlService>;
  let deleteShortUrlService: jest.Mocked<DeleteShortUrlService>;

  const mockCreateShortUrlService = {
    execute: jest.fn(),
  };

  const mockListShortnerUrlsService = {
    execute: jest.fn(),
  };

  const mockHandleShortUrlService = {
    execute: jest.fn(),
  };

  const mockUpdateShortUrlService = {
    execute: jest.fn(),
  };

  const mockDeleteShortUrlService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortUrlController],
      providers: [
        {
          provide: CreateShortUrlService,
          useValue: mockCreateShortUrlService,
        },
        {
          provide: ListShortnerUrlsService,
          useValue: mockListShortnerUrlsService,
        },
        {
          provide: HandleShortUrlService,
          useValue: mockHandleShortUrlService,
        },
        {
          provide: UpdateShortUrlService,
          useValue: mockUpdateShortUrlService,
        },
        {
          provide: DeleteShortUrlService,
          useValue: mockDeleteShortUrlService,
        },
      ],
    }).compile();

    controller = module.get<ShortUrlController>(ShortUrlController);
    createShortUrlService = module.get(CreateShortUrlService);
    listShortnerUrlsService = module.get(ListShortnerUrlsService);
    handleShortUrlService = module.get(HandleShortUrlService);
    updateShortUrlService = module.get(UpdateShortUrlService);
    deleteShortUrlService = module.get(DeleteShortUrlService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a short url and return formatted output', async () => {
      const body = { url: 'https://example.com/very-long-url' };
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: body.url,
      });

      const mockServiceResponse = { shortUrl: mockShortUrl };
      createShortUrlService.execute.mockResolvedValue(mockServiceResponse);

      const presentationSpy = jest.spyOn(ShortUrlPresentation, 'toController');

      const result = await controller.create(body);

      expect(createShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(createShortUrlService.execute).toHaveBeenCalledWith({
        url: body.url,
      });
      expect(presentationSpy).toHaveBeenCalledWith(mockShortUrl);
      expect(result).toBeDefined();
    });

    it('should handle different urls', async () => {
      const body = { url: 'https://different-domain.com/path?query=value' };
      const mockShortUrl = ShortUrl.create({
        hash: 'xyz789',
        url: body.url,
      });

      createShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      const result = await controller.create(body);

      expect(createShortUrlService.execute).toHaveBeenCalledWith({
        url: body.url,
      });
      expect(result).toBeDefined();
    });

    it('should propagate service errors', async () => {
      const body = { url: 'https://example.com' };
      const error = new Error('Service error');
      createShortUrlService.execute.mockRejectedValue(error);

      await expect(controller.create(body)).rejects.toThrow('Service error');
    });
  });

  describe('list', () => {
    it('should list short urls with pagination and return formatted output', async () => {
      const params = {
        page: 1,
        order_by: 'created_at' as any,
        order: 'desc' as any,
      };

      const mockShortUrls = [
        ShortUrl.create({ hash: 'abc123', url: 'https://example1.com' }),
        ShortUrl.create({ hash: 'def456', url: 'https://example2.com' }),
      ];

      const mockServiceResponse = {
        data: mockShortUrls,
        totalPages: 5,
        currentPage: 1,
      };

      listShortnerUrlsService.execute.mockResolvedValue(mockServiceResponse);

      const presentationSpy = jest.spyOn(ShortUrlPresentation, 'toController');

      const result = await controller.list(params);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledTimes(1);
      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        page: 1,
        order: 'desc',
        orderBy: 'createdAt',
      });
      expect(presentationSpy).toHaveBeenCalledWith(mockShortUrls, 5, 1);
      expect(result).toBeDefined();
    });

    it('should use default values when params are not provided', async () => {
      const params = {};

      const mockServiceResponse = {
        data: [],
        totalPages: 1,
        currentPage: 1,
      };

      listShortnerUrlsService.execute.mockResolvedValue(mockServiceResponse);

      await controller.list(params);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
    });

    it('should handle order_by updated_at', async () => {
      const params = {
        page: 2,
        order_by: 'updated_at' as any,
        order: 'asc' as any,
      };

      const mockServiceResponse = {
        data: [],
        totalPages: 3,
        currentPage: 2,
      };

      listShortnerUrlsService.execute.mockResolvedValue(mockServiceResponse);

      await controller.list(params);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        page: 2,
        order: 'asc',
        orderBy: 'updatedAt',
      });
    });

    it('should handle different page numbers', async () => {
      const params = {
        page: 10,
        order_by: 'created_at' as any,
        order: 'desc' as any,
      };

      const mockServiceResponse = {
        data: [ShortUrl.create({ hash: 'test', url: 'https://test.com' })],
        totalPages: 15,
        currentPage: 10,
      };

      listShortnerUrlsService.execute.mockResolvedValue(mockServiceResponse);

      await controller.list(params);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        page: 10,
        order: 'desc',
        orderBy: 'createdAt',
      });
    });

    it('should handle empty list', async () => {
      const params = {
        page: 1,
        order_by: 'created_at' as any,
        order: 'asc' as any,
      };

      const mockServiceResponse = {
        data: [],
        totalPages: 0,
        currentPage: 1,
      };

      listShortnerUrlsService.execute.mockResolvedValue(mockServiceResponse);

      const result = await controller.list(params);

      expect(result).toBeDefined();
      expect(listShortnerUrlsService.execute).toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const params = {
        page: 1,
        order_by: 'created_at' as any,
        order: 'desc' as any,
      };
      const error = new Error('Database error');
      listShortnerUrlsService.execute.mockRejectedValue(error);

      await expect(controller.list(params)).rejects.toThrow('Database error');
    });

    it('should correctly map created_at to createdAt', async () => {
      const params = {
        page: 1,
        order_by: 'created_at' as any,
        order: 'desc' as any,
      };

      listShortnerUrlsService.execute.mockResolvedValue({
        data: [],
        totalPages: 0,
        currentPage: 1,
      });

      await controller.list(params);

      const callArgs = listShortnerUrlsService.execute.mock.calls[0][0];
      expect(callArgs.orderBy).toBe('createdAt');
    });

    it('should correctly map updated_at to updatedAt', async () => {
      const params = {
        page: 1,
        order_by: 'updated_at' as any,
        order: 'asc' as any,
      };

      listShortnerUrlsService.execute.mockResolvedValue({
        data: [],
        totalPages: 0,
        currentPage: 1,
      });

      await controller.list(params);

      const callArgs = listShortnerUrlsService.execute.mock.calls[0][0];
      expect(callArgs.orderBy).toBe('updatedAt');
    });
  });

  describe('update', () => {
    it('should update a short url and return formatted output', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const body = { url: 'https://example.com/updated-url' };
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: body.url,
      });

      const mockServiceResponse = { shortUrl: mockShortUrl };
      updateShortUrlService.execute.mockResolvedValue(mockServiceResponse);

      const presentationSpy = jest.spyOn(ShortUrlPresentation, 'toController');

      const result = await controller.update(params, body);

      expect(updateShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
      });
      expect(presentationSpy).toHaveBeenCalledWith(mockShortUrl);
      expect(result).toBeDefined();
    });

    it('should handle different ids and urls', async () => {
      const params = { id: 'a1b2c3d4-5678-90ab-cdef-123456789012' };
      const body = { url: 'https://different.com/path' };
      const mockShortUrl = ShortUrl.create({
        hash: 'xyz789',
        url: body.url,
      });

      updateShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      const result = await controller.update(params, body);

      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
      });
      expect(result).toBeDefined();
    });

    it('should propagate service errors', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const body = { url: 'https://example.com' };
      const error = new Error('Not found');
      updateShortUrlService.execute.mockRejectedValue(error);

      await expect(controller.update(params, body)).rejects.toThrow(
        'Not found',
      );
    });

    it('should handle urls with query parameters', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const body = {
        url: 'https://example.com/path?param1=value1&param2=value2',
      };
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: body.url,
      });

      updateShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      await controller.update(params, body);

      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
      });
    });

    it('should handle urls with fragments', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const body = { url: 'https://example.com/page#section' };
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: body.url,
      });

      updateShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      await controller.update(params, body);

      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
      });
    });
  });

  describe('delete', () => {
    it('should delete a short url', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      deleteShortUrlService.execute.mockResolvedValue(undefined);

      await controller.delete(params);

      expect(deleteShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(deleteShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
      });
    });

    it('should handle different ids', async () => {
      const params = { id: 'a1b2c3d4-5678-90ab-cdef-123456789012' };
      deleteShortUrlService.execute.mockResolvedValue(undefined);

      await controller.delete(params);

      expect(deleteShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
      });
    });

    it('should propagate service errors', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const error = new Error('Not found');
      deleteShortUrlService.execute.mockRejectedValue(error);

      await expect(controller.delete(params)).rejects.toThrow('Not found');
    });

    it('should not return any value', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      deleteShortUrlService.execute.mockResolvedValue(undefined);

      const result = await controller.delete(params);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const error = new Error('Database connection failed');
      deleteShortUrlService.execute.mockRejectedValue(error);

      await expect(controller.delete(params)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('redirect', () => {
    it('should redirect to original url', async () => {
      const params = { hash: 'abc123' };
      const mockShortUrl = ShortUrl.create({
        hash: params.hash,
        url: 'https://example.com/original',
      });

      const mockServiceResponse = { shortUrl: mockShortUrl };
      handleShortUrlService.execute.mockResolvedValue(mockServiceResponse);

      const result = await controller.redirect(params);

      expect(handleShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(handleShortUrlService.execute).toHaveBeenCalledWith({
        hash: params.hash,
      });
      expect(result).toEqual({
        url: 'https://example.com/original',
      });
    });

    it('should handle different hashes', async () => {
      const params = { hash: 'xyz789' };
      const mockShortUrl = ShortUrl.create({
        hash: params.hash,
        url: 'https://different.com/path',
      });

      handleShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      const result = await controller.redirect(params);

      expect(result).toEqual({
        url: 'https://different.com/path',
      });
    });

    it('should return null when response is falsy', async () => {
      const params = { hash: 'notfound' };
      handleShortUrlService.execute.mockResolvedValue(null as any);

      const result = await controller.redirect(params);

      expect(result).toBeNull();
      expect(handleShortUrlService.execute).toHaveBeenCalledWith({
        hash: params.hash,
      });
    });

    it('should return null when response is undefined', async () => {
      const params = { hash: 'undefined' };
      handleShortUrlService.execute.mockResolvedValue(undefined as any);

      const result = await controller.redirect(params);

      expect(result).toBeNull();
    });

    it('should propagate service errors', async () => {
      const params = { hash: 'error123' };
      const error = new Error('Not found');
      handleShortUrlService.execute.mockRejectedValue(error);

      await expect(controller.redirect(params)).rejects.toThrow('Not found');
    });

    it('should handle urls with query parameters', async () => {
      const params = { hash: 'query123' };
      const mockShortUrl = ShortUrl.create({
        hash: params.hash,
        url: 'https://example.com/path?param1=value1&param2=value2',
      });

      handleShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      const result = await controller.redirect(params);

      expect(result).toEqual({
        url: 'https://example.com/path?param1=value1&param2=value2',
      });
    });

    it('should handle urls with fragments', async () => {
      const params = { hash: 'fragment' };
      const mockShortUrl = ShortUrl.create({
        hash: params.hash,
        url: 'https://example.com/page#section',
      });

      handleShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      const result = await controller.redirect(params);

      expect(result).toEqual({
        url: 'https://example.com/page#section',
      });
    });

    it('should increment click count on redirect', async () => {
      const params = { hash: 'click123' };
      const mockShortUrl = ShortUrl.create({
        hash: params.hash,
        url: 'https://example.com',
      });

      handleShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      await controller.redirect(params);

      expect(handleShortUrlService.execute).toHaveBeenCalledWith({
        hash: params.hash,
      });
    });
  });
});
