/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlController } from './short-url.controller';
import { CreateShortUrlService } from './services/create-short-url.service';
import { ListShortnerUrlsByUserService } from './services/list-shortner-urls-by-user.service';
import { HandleShortUrlService } from './services/handle-short-url.service';
import { UpdateShortUrlService } from './services/update-short-url.service';
import { DeleteShortUrlService } from './services/delete-short-url.service';
import { ShortUrl } from '../domain/entities/short-url.entity';
import { ShortUrlPresentation } from './presentation/short-url.presentation';
import { AuthGuard } from '@/modules/auth/infra/guards/auth.guard';
import { SessionGuard } from '@/modules/auth/infra/guards/session.guard';
import { ExecutionContext } from '@nestjs/common';

describe('ShortUrlController', () => {
  let controller: ShortUrlController;
  let createShortUrlService: jest.Mocked<CreateShortUrlService>;
  let listShortnerUrlsService: jest.Mocked<ListShortnerUrlsByUserService>;
  let handleShortUrlService: jest.Mocked<HandleShortUrlService>;
  let updateShortUrlService: jest.Mocked<UpdateShortUrlService>;
  let deleteShortUrlService: jest.Mocked<DeleteShortUrlService>;
  let authGuard: AuthGuard;
  let sessionGuard: SessionGuard;

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

  const mockEncodingPort = {
    encode: jest.fn(),
    dencode: jest.fn(),
  };

  const mockSessionsRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const mockSession = {
    userId: 'user-123',
    sessionId: 'session-456',
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
          provide: ListShortnerUrlsByUserService,
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
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: SessionGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: 'EncodingPort',
          useValue: mockEncodingPort,
        },
        {
          provide: 'SessionsRepository',
          useValue: mockSessionsRepository,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(SessionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ShortUrlController>(ShortUrlController);
    createShortUrlService = module.get(CreateShortUrlService);
    listShortnerUrlsService = module.get(ListShortnerUrlsByUserService);
    handleShortUrlService = module.get(HandleShortUrlService);
    updateShortUrlService = module.get(UpdateShortUrlService);
    deleteShortUrlService = module.get(DeleteShortUrlService);
    authGuard = module.get(AuthGuard);
    sessionGuard = module.get(SessionGuard);

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

      const result = await controller.create(body, mockSession as any);

      expect(createShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(createShortUrlService.execute).toHaveBeenCalledWith({
        url: body.url,
        userId: mockSession.userId,
      });
      expect(presentationSpy).toHaveBeenCalledWith(mockShortUrl);
      expect(result).toBeDefined();
    });

    it('should create a short url without userId when session is undefined', async () => {
      const body = { url: 'https://example.com/very-long-url' };
      const mockShortUrl = ShortUrl.create({
        hash: 'abc123',
        url: body.url,
      });

      createShortUrlService.execute.mockResolvedValue({
        shortUrl: mockShortUrl,
      });

      await controller.create(body, undefined);

      expect(createShortUrlService.execute).toHaveBeenCalledWith({
        url: body.url,
        userId: undefined,
      });
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

      const result = await controller.create(body, mockSession as any);

      expect(createShortUrlService.execute).toHaveBeenCalledWith({
        url: body.url,
        userId: mockSession.userId,
      });
      expect(result).toBeDefined();
    });

    it('should propagate service errors', async () => {
      const body = { url: 'https://example.com' };
      const error = new Error('Service error');
      createShortUrlService.execute.mockRejectedValue(error);

      await expect(controller.create(body, mockSession as any)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('list', () => {
    beforeEach(() => {
      (authGuard.canActivate as jest.Mock).mockResolvedValue(true);
      (sessionGuard.canActivate as jest.Mock).mockResolvedValue(true);
    });

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

      const result = await controller.list(params, mockSession as any);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledTimes(1);
      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        userId: mockSession.userId,
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

      await controller.list(params, mockSession as any);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        userId: mockSession.userId,
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

      await controller.list(params, mockSession as any);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        userId: mockSession.userId,
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

      await controller.list(params, mockSession as any);

      expect(listShortnerUrlsService.execute).toHaveBeenCalledWith({
        userId: mockSession.userId,
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

      const result = await controller.list(params, mockSession as any);

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

      await expect(controller.list(params, mockSession as any)).rejects.toThrow(
        'Database error',
      );
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

      await controller.list(params, mockSession as any);

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

      await controller.list(params, mockSession as any);

      const callArgs = listShortnerUrlsService.execute.mock.calls[0][0];
      expect(callArgs.orderBy).toBe('updatedAt');
    });

    it('should block access when authentication fails', async () => {
      (authGuard.canActivate as jest.Mock).mockResolvedValue(false);

      const result = await authGuard.canActivate({} as ExecutionContext);

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      (authGuard.canActivate as jest.Mock).mockResolvedValue(true);
      (sessionGuard.canActivate as jest.Mock).mockResolvedValue(true);
    });

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

      const result = await controller.update(params, body, mockSession as any);

      expect(updateShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
        userId: mockSession.userId,
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

      const result = await controller.update(params, body, mockSession as any);

      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
        userId: mockSession.userId,
      });
      expect(result).toBeDefined();
    });

    it('should propagate service errors', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const body = { url: 'https://example.com' };
      const error = new Error('Not found');
      updateShortUrlService.execute.mockRejectedValue(error);

      await expect(
        controller.update(params, body, mockSession as any),
      ).rejects.toThrow('Not found');
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

      await controller.update(params, body, mockSession as any);

      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
        userId: mockSession.userId,
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

      await controller.update(params, body, mockSession as any);

      expect(updateShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        url: body.url,
        userId: mockSession.userId,
      });
    });

    it('should block access when authentication fails', async () => {
      (authGuard.canActivate as jest.Mock).mockResolvedValue(false);

      const result = await authGuard.canActivate({} as ExecutionContext);

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      (authGuard.canActivate as jest.Mock).mockResolvedValue(true);
      (sessionGuard.canActivate as jest.Mock).mockResolvedValue(true);
    });

    it('should delete a short url', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      deleteShortUrlService.execute.mockResolvedValue(undefined);

      await controller.delete(params, mockSession as any);

      expect(deleteShortUrlService.execute).toHaveBeenCalledTimes(1);
      expect(deleteShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        userId: mockSession.userId,
      });
    });

    it('should handle different ids', async () => {
      const params = { id: 'a1b2c3d4-5678-90ab-cdef-123456789012' };
      deleteShortUrlService.execute.mockResolvedValue(undefined);

      await controller.delete(params, mockSession as any);

      expect(deleteShortUrlService.execute).toHaveBeenCalledWith({
        id: params.id,
        userId: mockSession.userId,
      });
    });

    it('should propagate service errors', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const error = new Error('Not found');
      deleteShortUrlService.execute.mockRejectedValue(error);

      await expect(
        controller.delete(params, mockSession as any),
      ).rejects.toThrow('Not found');
    });

    it('should not return any value', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      deleteShortUrlService.execute.mockResolvedValue(undefined);

      const result = await controller.delete(params, mockSession as any);

      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      const params = { id: 'b7f9d2a3-4567-8901-abcd-ef2345678901' };
      const error = new Error('Database connection failed');
      deleteShortUrlService.execute.mockRejectedValue(error);

      await expect(
        controller.delete(params, mockSession as any),
      ).rejects.toThrow('Database connection failed');
    });

    it('should block access when authentication fails', async () => {
      (authGuard.canActivate as jest.Mock).mockResolvedValue(false);

      const result = await authGuard.canActivate({} as ExecutionContext);

      expect(result).toBe(false);
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

  describe('AuthGuard and SessionGuard integration', () => {
    it('should verify guards are applied to list endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.list);
      expect(guards).toBeDefined();
    });

    it('should verify guards are applied to update endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.update);
      expect(guards).toBeDefined();
    });

    it('should verify guards are applied to delete endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.delete);
      expect(guards).toBeDefined();
    });

    it('should verify SessionGuard is applied to create endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.create);
      expect(guards).toBeDefined();
    });

    it('should verify guards are NOT applied to redirect endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.redirect);
      expect(guards).toBeUndefined();
    });
  });
});
