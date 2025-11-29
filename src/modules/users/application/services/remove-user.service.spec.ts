import { Test, TestingModule } from '@nestjs/testing';
import { RemoveUserService } from './remove-user.service';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { User } from '../../domain/entities/user.entity';
import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRole } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Bus } from '@/shared/domain-events/bus';
import { BaseEvent } from '@/shared/common/base-event';

jest.mock('@/shared/domain-events/bus');

describe('RemoveUserService', () => {
  let service: RemoveUserService;
  let usersRepository: jest.Mocked<UsersRepository>;

  const mockUser = User.create({
    name: Name.create('John Doe'),
    email: Email.create('john@example.com'),
    password: Password.create('Password123!'),
    role: UserRole.ADMIN,
  });

  beforeEach(async () => {
    const mockUsersRepository: Partial<jest.Mocked<UsersRepository>> = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveUserService,
        {
          provide: 'UsersRepository',
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<RemoveUserService>(RemoveUserService);
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
    it('should remove a user successfully', async () => {
      const userId = mockUser.id;
      const mockEvents = [
        {
          occurredOn: new Date(),
          id: userId,
        },
      ];

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'remove');
      jest
        .spyOn(mockUser, 'pullEvents')
        .mockReturnValue(mockEvents as unknown as Array<BaseEvent<unknown>>);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId });

      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(usersRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockUser.remove).toHaveBeenCalledTimes(1);
      expect(usersRepository.delete).toHaveBeenCalledWith(userId);
      expect(usersRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockUser.pullEvents).toHaveBeenCalledTimes(1);
      expect(Bus.dispatch).toHaveBeenCalledWith(mockEvents);
      expect(Bus.dispatch).toHaveBeenCalledTimes(1);
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      const nonExistentId = 'non-existent-id';
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: nonExistentId })).rejects.toThrow(
        UserNotFoundError,
      );
      await expect(service.execute({ id: nonExistentId })).rejects.toThrow(
        `User not found: ${nonExistentId}`,
      );

      expect(usersRepository.findById).toHaveBeenCalledWith(nonExistentId);
      expect(usersRepository.findById).toHaveBeenCalledTimes(2);
      expect(usersRepository.delete).not.toHaveBeenCalled();
      expect(Bus.dispatch).not.toHaveBeenCalled();
    });

    it('should call remove method on user entity', async () => {
      const userId = mockUser.id;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(undefined);
      const removeSpy = jest.spyOn(mockUser, 'remove');
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId });

      expect(removeSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledWith();
    });

    it('should dispatch events after removing user', async () => {
      const userId = mockUser.id;
      const mockEvents = [
        {
          type: 'UserRemovedEvent',
          occurredOn: new Date(),
          id: userId,
        },
      ];

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'remove');
      jest
        .spyOn(mockUser, 'pullEvents')
        .mockReturnValue(mockEvents as unknown as Array<BaseEvent<unknown>>);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId });

      expect(Bus.dispatch).toHaveBeenCalledWith(mockEvents);
    });

    it('should handle repository findById errors', async () => {
      const userId = 'some-id';
      const error = new Error('Database connection failed');
      usersRepository.findById.mockRejectedValue(error);

      await expect(service.execute({ id: userId })).rejects.toThrow(
        'Database connection failed',
      );
      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(usersRepository.delete).not.toHaveBeenCalled();
      expect(Bus.dispatch).not.toHaveBeenCalled();
    });

    it('should handle repository delete errors', async () => {
      const userId = mockUser.id;
      const error = new Error('Delete operation failed');

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.delete.mockRejectedValue(error);
      jest.spyOn(mockUser, 'remove');
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);

      await expect(service.execute({ id: userId })).rejects.toThrow(
        'Delete operation failed',
      );
      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.remove).toHaveBeenCalled();
      expect(usersRepository.delete).toHaveBeenCalledWith(userId);
      expect(Bus.dispatch).not.toHaveBeenCalled();
    });

    it('should handle Bus.dispatch errors', async () => {
      const userId = mockUser.id;
      const error = new Error('Event dispatch failed');

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'remove');
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockRejectedValue(error);

      await expect(service.execute({ id: userId })).rejects.toThrow(
        'Event dispatch failed',
      );
      expect(usersRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.remove).toHaveBeenCalled();
      expect(usersRepository.delete).toHaveBeenCalledWith(userId);
      expect(Bus.dispatch).toHaveBeenCalled();
    });

    it('should execute operations in correct order', async () => {
      const userId = mockUser.id;
      const callOrder: string[] = [];

      usersRepository.findById.mockImplementation(async () => {
        callOrder.push('findById');
        return mockUser;
      });

      jest.spyOn(mockUser, 'remove').mockImplementation(() => {
        callOrder.push('remove');
      });

      usersRepository.delete.mockImplementation(async () => {
        callOrder.push('delete');
      });

      jest.spyOn(mockUser, 'pullEvents').mockImplementation(() => {
        callOrder.push('pullEvents');
        return [];
      });

      (Bus.dispatch as jest.Mock).mockImplementation(async () => {
        callOrder.push('dispatch');
      });

      await service.execute({ id: userId });

      expect(callOrder).toEqual([
        'findById',
        'remove',
        'delete',
        'pullEvents',
        'dispatch',
      ]);
    });

    it('should handle empty events array', async () => {
      const userId = mockUser.id;

      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(undefined);
      jest.spyOn(mockUser, 'remove');
      jest.spyOn(mockUser, 'pullEvents').mockReturnValue([]);
      (Bus.dispatch as jest.Mock).mockResolvedValue(undefined);

      await service.execute({ id: userId });

      expect(Bus.dispatch).toHaveBeenCalledWith([]);
    });
  });
});
