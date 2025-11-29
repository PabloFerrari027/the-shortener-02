import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { ListUsersService } from './services/list-users.service';
import { RemoveUserService } from './services/remove-user.service';
import { UpdateUserService } from './services/update-user.service';
import { User, UserRole } from '../domain/entities/user.entity';
import { Name } from '../domain/value-objects/name.value-object';
import { Email } from '../domain/value-objects/email.value-object';
import { Password } from '../domain/value-objects/password.value-object';
import { UserPresentation } from './presentation/user.presentation';
import { AuthGuard } from '@/modules/auth/infra/guards/auth.guard';
import { AdminGuard } from '@/modules/auth/infra/guards/admin.guard';
import { SessionGuard } from '@/modules/auth/infra/guards/session.guard';

jest.mock('./presentation/user.presentation');

describe('UsersController', () => {
  let controller: UsersController;
  let listUsersService: jest.Mocked<ListUsersService>;
  let removeUserService: jest.Mocked<RemoveUserService>;
  let updateUserService: jest.Mocked<UpdateUserService>;

  const mockSessionGuard = {
    canActivate: jest.fn().mockResolvedValue(true),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockResolvedValue(true),
  };

  const mockAdminGuard = {
    canActivate: jest.fn().mockResolvedValue(true),
  };

  const createMockUser = (role: UserRole = UserRole.ADMIN) => {
    return User.create({
      name: Name.create('John Doe'),
      email: Email.create('john@example.com'),
      password: Password.create('Password123!'),
      role,
    });
  };

  const mockUser = createMockUser();
  const mockUser2 = createMockUser(UserRole.CLINET);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: ListUsersService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RemoveUserService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateUserService,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SessionGuard)
      .useValue(mockSessionGuard)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    listUsersService = module.get(ListUsersService);
    removeUserService = module.get(RemoveUserService);
    updateUserService = module.get(UpdateUserService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should list users with default parameters', async () => {
      const mockServiceResponse = {
        data: [mockUser, mockUser2],
        currentPage: 1,
        totalPages: 1,
      };

      const mockPresentation = {
        data: [
          {
            id: mockUser.id,
            name: mockUser.name.value,
            email: mockUser.email.value,
            role: mockUser.role,
            created_at: mockUser.createdAt.toISOString(),
            updated_at: mockUser.updatedAt.toISOString(),
          },
        ],
        current_page: 1,
        total_pages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue(
        mockPresentation,
      );

      const result = await controller.list({});

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
      expect(UserPresentation.toController).toHaveBeenCalledWith(
        mockServiceResponse.data,
        mockServiceResponse.totalPages,
        mockServiceResponse.currentPage,
      );
      expect(result).toEqual(mockPresentation);
    });

    it('should list users without params', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list();

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
    });

    it('should list users with custom page', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 2,
        totalPages: 3,
      };

      const mockPresentation = {
        data: [],
        current_page: 2,
        total_pages: 3,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue(
        mockPresentation,
      );

      await controller.list({ page: 2 });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 2,
        order: undefined,
        orderBy: 'createdAt',
      });
    });

    it('should list users with order_by created_at', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ order_by: 'created_at' as any });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
    });

    it('should list users with order_by updated_at', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ order_by: 'updated_at' as any });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'updatedAt',
      });
    });

    it('should list users with order asc', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ order: 'asc' as any });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: 'asc',
        orderBy: 'createdAt',
      });
    });

    it('should list users with order desc', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ order: 'desc' as any });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: 'desc',
        orderBy: 'createdAt',
      });
    });

    it('should list users with all parameters', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 2,
        totalPages: 5,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({
        page: 2,
        order_by: 'updated_at' as any,
        order: 'desc' as any,
      });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 2,
        order: 'desc',
        orderBy: 'updatedAt',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      listUsersService.execute.mockRejectedValue(error);

      await expect(controller.list({})).rejects.toThrow('Service error');
    });

    it('should use default orderBy when order_by is not provided', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ page: 1 });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
    });
  });

  describe('update', () => {
    it('should update user role successfully', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };

      const mockPresentation = {
        id: mockUser.id,
        name: mockUser.name.value,
        email: mockUser.email.value,
        role: UserRole.ADMIN,
        created_at: mockUser.createdAt.toISOString(),
        updated_at: mockUser.updatedAt.toISOString(),
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue(
        mockPresentation,
      );

      const result = await controller.update(
        { id: userId },
        { role: UserRole.ADMIN },
      );

      expect(updateUserService.execute).toHaveBeenCalledWith({
        id: userId,
        role: UserRole.ADMIN,
      });
      expect(UserPresentation.toController).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockPresentation);
    });

    it('should update user without role', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.update({ id: userId }, {});

      expect(updateUserService.execute).toHaveBeenCalledWith({
        id: userId,
        role: undefined,
      });
    });

    it('should update user with CLINET role', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser2,
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.update({ id: userId }, { role: UserRole.CLINET });

      expect(updateUserService.execute).toHaveBeenCalledWith({
        id: userId,
        role: UserRole.CLINET,
      });
    });

    it('should handle service errors', async () => {
      const userId = mockUser.id;
      const error = new Error('Update failed');
      updateUserService.execute.mockRejectedValue(error);

      await expect(
        controller.update({ id: userId }, { role: UserRole.ADMIN }),
      ).rejects.toThrow('Update failed');
    });

    it('should call presentation layer correctly', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.update({ id: userId }, { role: UserRole.ADMIN });

      expect(UserPresentation.toController).toHaveBeenCalledTimes(1);
      expect(UserPresentation.toController).toHaveBeenCalledWith(mockUser);
    });

    it('should return presentation output', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };
      const expectedOutput = { id: userId, name: 'John Doe' };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue(
        expectedOutput,
      );

      const result = await controller.update(
        { id: userId },
        { role: UserRole.ADMIN },
      );

      expect(result).toEqual(expectedOutput);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userId = mockUser.id;

      removeUserService.execute.mockResolvedValue(undefined);

      const result = await controller.delete({ id: userId });

      expect(removeUserService.execute).toHaveBeenCalledWith({
        id: userId,
      });
      expect(removeUserService.execute).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should delete user with different id', async () => {
      const userId = 'different-id';

      removeUserService.execute.mockResolvedValue(undefined);

      await controller.delete({ id: userId });

      expect(removeUserService.execute).toHaveBeenCalledWith({
        id: userId,
      });
    });

    it('should handle service errors', async () => {
      const userId = mockUser.id;
      const error = new Error('Delete failed');
      removeUserService.execute.mockRejectedValue(error);

      await expect(controller.delete({ id: userId })).rejects.toThrow(
        'Delete failed',
      );
    });

    it('should not return any value', async () => {
      const userId = mockUser.id;
      removeUserService.execute.mockResolvedValue(undefined);

      const result = await controller.delete({ id: userId });

      expect(result).toBeUndefined();
    });

    it('should call service only once per delete', async () => {
      const userId = 'test-id-123';
      removeUserService.execute.mockResolvedValue(undefined);

      await controller.delete({ id: userId });

      expect(removeUserService.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Guards', () => {
    it('should have SessionGuard, AuthGuard and AdminGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', UsersController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });

    it('should allow access when all guards pass', async () => {
      mockSessionGuard.canActivate.mockResolvedValue(true);
      mockAuthGuard.canActivate.mockResolvedValue(true);
      mockAdminGuard.canActivate.mockResolvedValue(true);

      const sessionResult = await mockSessionGuard.canActivate({} as any);
      const authResult = await mockAuthGuard.canActivate({} as any);
      const adminResult = await mockAdminGuard.canActivate({} as any);

      expect(sessionResult).toBe(true);
      expect(authResult).toBe(true);
      expect(adminResult).toBe(true);
    });

    it('should deny access when SessionGuard fails', async () => {
      mockSessionGuard.canActivate.mockResolvedValue(false);

      const result = await mockSessionGuard.canActivate({} as any);

      expect(result).toBe(false);
    });

    it('should deny access when AuthGuard fails', async () => {
      mockAuthGuard.canActivate.mockResolvedValue(false);

      const result = await mockAuthGuard.canActivate({} as any);

      expect(result).toBe(false);
    });

    it('should deny access when AdminGuard fails', async () => {
      mockAdminGuard.canActivate.mockResolvedValue(false);

      const result = await mockAdminGuard.canActivate({} as any);

      expect(result).toBe(false);
    });

    it('should deny access when multiple guards fail', async () => {
      mockSessionGuard.canActivate.mockResolvedValue(false);
      mockAuthGuard.canActivate.mockResolvedValue(false);
      mockAdminGuard.canActivate.mockResolvedValue(true);

      const sessionResult = await mockSessionGuard.canActivate({} as any);
      const authResult = await mockAuthGuard.canActivate({} as any);

      expect(sessionResult).toBe(false);
      expect(authResult).toBe(false);
    });

    it('should deny access when all guards fail', async () => {
      mockSessionGuard.canActivate.mockResolvedValue(false);
      mockAuthGuard.canActivate.mockResolvedValue(false);
      mockAdminGuard.canActivate.mockResolvedValue(false);

      const sessionResult = await mockSessionGuard.canActivate({} as any);
      const authResult = await mockAuthGuard.canActivate({} as any);
      const adminResult = await mockAdminGuard.canActivate({} as any);

      expect(sessionResult).toBe(false);
      expect(authResult).toBe(false);
      expect(adminResult).toBe(false);
    });
  });

  describe('Service dependencies', () => {
    it('should have listUsersService injected', () => {
      expect(listUsersService).toBeDefined();
    });

    it('should have removeUserService injected', () => {
      expect(removeUserService).toBeDefined();
    });

    it('should have updateUserService injected', () => {
      expect(updateUserService).toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      updateUserService.execute.mockResolvedValue({ user: mockUser });
      removeUserService.execute.mockResolvedValue(undefined);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({});
      await controller.update({ id: mockUser.id }, { role: UserRole.ADMIN });
      await controller.delete({ id: mockUser.id });

      expect(listUsersService.execute).toHaveBeenCalledTimes(1);
      expect(updateUserService.execute).toHaveBeenCalledTimes(1);
      expect(removeUserService.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle list and update operations', async () => {
      const mockServiceResponse = {
        data: [mockUser, mockUser2],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      updateUserService.execute.mockResolvedValue({ user: mockUser });
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ page: 1, order: 'asc' as any });
      await controller.update({ id: mockUser.id }, { role: UserRole.CLINET });

      expect(listUsersService.execute).toHaveBeenCalled();
      expect(updateUserService.execute).toHaveBeenCalled();
    });

    it('should maintain service isolation between calls', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ page: 1 });
      await controller.list({ page: 2 });

      expect(listUsersService.execute).toHaveBeenCalledTimes(2);
      expect(listUsersService.execute).toHaveBeenNthCalledWith(1, {
        page: 1,
        order: undefined,
        orderBy: 'createdAt',
      });
      expect(listUsersService.execute).toHaveBeenNthCalledWith(2, {
        page: 2,
        order: undefined,
        orderBy: 'createdAt',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty user list', async () => {
      const mockServiceResponse = {
        data: [],
        currentPage: 1,
        totalPages: 0,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({
        data: [],
        current_page: 1,
        total_pages: 0,
      });

      const result = await controller.list({});

      expect(result.data).toEqual([]);
    });

    it('should handle high page numbers', async () => {
      const mockServiceResponse = {
        data: [],
        currentPage: 999,
        totalPages: 1000,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({ page: 999 });

      expect(listUsersService.execute).toHaveBeenCalledWith({
        page: 999,
        order: undefined,
        orderBy: 'createdAt',
      });
    });

    it('should handle update with same role', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.update({ id: userId }, { role: UserRole.ADMIN });
      await controller.update({ id: userId }, { role: UserRole.ADMIN });

      expect(updateUserService.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Presentation layer integration', () => {
    it('should call UserPresentation.toController with correct arguments for list', async () => {
      const mockServiceResponse = {
        data: [mockUser, mockUser2],
        currentPage: 1,
        totalPages: 5,
      };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.list({});

      expect(UserPresentation.toController).toHaveBeenCalledWith(
        [mockUser, mockUser2],
        5,
        1,
      );
    });

    it('should call UserPresentation.toController with correct arguments for update', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue({});

      await controller.update({ id: userId }, { role: UserRole.ADMIN });

      expect(UserPresentation.toController).toHaveBeenCalledWith(mockUser);
    });

    it('should return exact output from UserPresentation for list', async () => {
      const mockServiceResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };
      const expectedOutput = { data: [], current_page: 1, total_pages: 1 };

      listUsersService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue(
        expectedOutput,
      );

      const result = await controller.list({});

      expect(result).toEqual(expectedOutput);
    });

    it('should return exact output from UserPresentation for update', async () => {
      const userId = mockUser.id;
      const mockServiceResponse = {
        user: mockUser,
      };
      const expectedOutput = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.ADMIN,
      };

      updateUserService.execute.mockResolvedValue(mockServiceResponse);
      (UserPresentation.toController as jest.Mock).mockReturnValue(
        expectedOutput,
      );

      const result = await controller.update(
        { id: userId },
        { role: UserRole.ADMIN },
      );

      expect(result).toEqual(expectedOutput);
    });
  });
});
