import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserService } from './update-user.service';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { User, UserRole } from '../../domain/entities/user.entity';
import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Bus } from '@/shared/domain-events/bus';
import { BaseEvent } from '@/shared/common/base-event';

jest.mock('@/shared/domain-events/bus');

describe('UpdateUserService', () => {
  let service: UpdateUserService;
  let usersRepository: jest.Mocked<UsersRepository>;

  const createMockUser = (role: UserRole = UserRole.CLINET) => {
    return User.create({
      name: Name.create('John Doe'),
      email: Email.create('john@example.com'),
      password: Password.create('Password123!'),
      role,
    });
  };

  beforeEach(async () => {
    const mockUsersRepository: Partial<jest.Mocked<UsersRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserService,
        {
          provide: 'UsersRepository',
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateUserService>(UpdateUserService);
    usersRepository = module.get('UsersRepository');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should update user role successfully', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;
      const mockEvents = [
        {
          type: 'UserRoleChangedEvent',
          occurredOn: new Date(),
          id: userId,
          from: UserRole.CLINET,
          to: UserRole.ADMIN,
        },
      ];

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest
        .spyOn(mockUser, 'pullEvents')
        .mockReturnValue(mockEvents as unknown as Array<BaseEvent<unknown>>);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      const result = await service.execute({
        id: userId,
        role: UserRole.ADMIN,
      });

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(usersRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockUser.role).toBe(UserRole.ADMIN);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser);
      expect(usersRepository.update).toHaveBeenCalledTimes(1);
      expect(mockUser.pullEvents).toHaveBeenCalledTimes(1);
      expect(Bus.dispatch).toHaveBeenCalledWith(mockEvents);
      expect(Bus.dispatch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute({ id: nonExistentId, role: UserRole.ADMIN }),
      ).rejects.toThrow(UserNotFoundError);

      await expect(
        service.execute({ id: nonExistentId, role: UserRole.ADMIN }),
      ).rejects.toThrow(`User not found: ${nonExistentId}`);

      expect(usersRepository.findById).toHaveBeenCalledWith(nonExistentId);
      expect(usersRepository.findById).toHaveBeenCalledTimes(2);
      expect(usersRepository.update).not.toHaveBeenCalled();
      expect(Bus.dispatch).not.toHaveBeenCalled();
    });

    it('should update user without role when role is not provided', async () => {
      const mockUser = createMockUser(UserRole.ADMIN);
      const userId = mockUser.id;
      const originalRole = mockUser.role;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      const result = await service.execute({ id: userId });

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.role).toBe(originalRole);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser);
      expect(mockUser.pullEvents).toHaveBeenCalledTimes(1);
      expect(Bus.dispatch).toHaveBeenCalledWith([]);
      expect(result).toEqual({ user: mockUser });
    });

    it('should not change role when role is undefined', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;
      const roleSpy = jest.spyOn(mockUser, 'role', 'set');

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId, role: undefined });

      expect(roleSpy).not.toHaveBeenCalled();
      expect(mockUser.role).toBe(UserRole.CLINET);
    });

    it('should change role from ADMIN to CLINET', async () => {
      const mockUser = createMockUser(UserRole.ADMIN);
      const userId = mockUser.id;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      const result = await service.execute({
        id: userId,
        role: UserRole.CLINET,
      });

      expect(mockUser.role).toBe(UserRole.CLINET);
      expect(result.user.role).toBe(UserRole.CLINET);
    });

    it('should dispatch events after updating user', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;
      const mockEvents = [
        {
          type: 'UserRoleChangedEvent',
          occurredOn: new Date(),
        },
      ];

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest
        .spyOn(mockUser, 'pullEvents')
        .mockReturnValue(mockEvents as unknown as Array<BaseEvent<unknown>>);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId, role: UserRole.ADMIN });

      expect(Bus.dispatch).toHaveBeenCalledWith(mockEvents);
    });

    it('should return updated user in response', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      const result = await service.execute({
        id: userId,
        role: UserRole.ADMIN,
      });

      expect(result).toHaveProperty('user');
      expect(result.user).toBe(mockUser);
      expect(result.user.id).toBe(userId);
    });

    it('should handle repository findById errors', async () => {
      const userId = 'some-id';
      const error = new Error('Database connection failed');
      usersRepository.findById.mockRejectedValue(error);

      await expect(
        service.execute({ id: userId, role: UserRole.ADMIN }),
      ).rejects.toThrow('Database connection failed');

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(usersRepository.update).not.toHaveBeenCalled();
      expect(Bus.dispatch).not.toHaveBeenCalled();
    });

    it('should handle repository update errors', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;
      const error = new Error('Update operation failed');

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockRejectedValue(error);

      await expect(
        service.execute({ id: userId, role: UserRole.ADMIN }),
      ).rejects.toThrow('Update operation failed');

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser);
      expect(Bus.dispatch).not.toHaveBeenCalled();
    });

    it('should handle Bus.dispatch errors', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;
      const error = new Error('Event dispatch failed');

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockRejectedValue(error);

      await expect(
        service.execute({ id: userId, role: UserRole.ADMIN }),
      ).rejects.toThrow('Event dispatch failed');

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser);
      expect(Bus.dispatch).toHaveBeenCalled();
    });

    it('should execute operations in correct order', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;
      const callOrder: string[] = [];

      usersRepository.findById.mockImplementation(async () => {
        callOrder.push('findById');
        return mockUser;
      });

      const originalRoleSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(mockUser),
        'role',
      )?.set;

      jest.spyOn(mockUser, 'role', 'set').mockImplementation(function (value) {
        callOrder.push('setRole');
        if (originalRoleSetter) {
          originalRoleSetter.call(this, value);
        }
      });

      usersRepository.update.mockImplementation(async () => {
        callOrder.push('update');
      });

      jest.spyOn(mockUser, 'pullEvents').mockImplementation(() => {
        callOrder.push('pullEvents');
        return [];
      });

      (Bus.dispatch as jest.Mock).mockImplementation(async () => {
        callOrder.push('dispatch');
      });

      await service.execute({ id: userId, role: UserRole.ADMIN });

      expect(callOrder).toEqual([
        'findById',
        'setRole',
        'update',
        'pullEvents',
        'dispatch',
      ]);
    });

    it('should handle empty events array', async () => {
      const mockUser = createMockUser(UserRole.CLINET);
      const userId = mockUser.id;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId, role: UserRole.ADMIN });

      expect(Bus.dispatch).toHaveBeenCalledWith([]);
    });

    it('should keep same role when provided role is the same as current', async () => {
      const mockUser = createMockUser(UserRole.ADMIN);
      const userId = mockUser.id;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId, role: UserRole.ADMIN });

      expect(mockUser.role).toBe(UserRole.ADMIN);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser);
    });
  });
});
