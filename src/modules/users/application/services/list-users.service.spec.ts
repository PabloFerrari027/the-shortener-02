import { Test, TestingModule } from '@nestjs/testing';
import { ListUsersService } from './list-users.service';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { User, UserProps } from '../../domain/entities/user.entity';
import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserRole } from '../../domain/entities/user.entity';
import { Order } from '@/shared/types/pagination-options.type';

describe('ListUsersService', () => {
  let service: ListUsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  const mockUser = User.create({
    name: Name.create('John Doe'),
    email: Email.create('john@example.com'),
    password: Password.create('Password123!'),
    role: UserRole.ADMIN,
  });

  const mockUser2 = User.create({
    name: Name.create('Jane Smith'),
    email: Email.create('jane@example.com'),
    password: Password.create('Password456!'),
    role: UserRole.CLINET,
  });

  beforeEach(async () => {
    const mockUsersRepository: Partial<jest.Mocked<UsersRepository>> = {
      list: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListUsersService,
        {
          provide: 'UsersRepository',
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<ListUsersService>(ListUsersService);
    usersRepository = module.get('UsersRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should list users with default pagination', async () => {
      const mockResponse = {
        data: [mockUser, mockUser2],
        currentPage: 1,
        totalPages: 1,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const result = await service.execute({ page: 1 });

      expect(usersRepository.list).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual({
        data: [mockUser, mockUser2],
        currentPage: 1,
        totalPages: 1,
      });
    });

    it('should list users with custom page number', async () => {
      const mockResponse = {
        data: [mockUser],
        currentPage: 2,
        totalPages: 3,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const result = await service.execute({ page: 2 });

      expect(usersRepository.list).toHaveBeenCalledWith({
        page: 2,
        order: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual({
        data: [mockUser],
        currentPage: 2,
        totalPages: 3,
      });
    });

    it('should list users with orderBy parameter', async () => {
      const mockResponse = {
        data: [mockUser, mockUser2],
        currentPage: 1,
        totalPages: 1,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const result = await service.execute({
        page: 1,
        orderBy: 'name',
      });

      expect(usersRepository.list).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: 'name',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should list users with order parameter', async () => {
      const mockResponse = {
        data: [mockUser2, mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const result = await service.execute({
        page: 1,
        order: Order.DESC,
      });

      expect(usersRepository.list).toHaveBeenCalledWith({
        page: 1,
        order: Order.DESC,
        orderBy: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should list users with both orderBy and order parameters', async () => {
      const mockResponse = {
        data: [mockUser2, mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const result = await service.execute({
        page: 1,
        orderBy: 'email',
        order: Order.ASC,
      });

      expect(usersRepository.list).toHaveBeenCalledWith({
        page: 1,
        order: Order.ASC,
        orderBy: 'email',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should list users with all possible orderBy fields', async () => {
      const mockResponse = {
        data: [mockUser],
        currentPage: 1,
        totalPages: 1,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const orderByFields: Array<keyof typeof mockUser> = [
        'id',
        'name',
        'email',
        'password',
        'role',
        'createdAt',
        'updatedAt',
      ];

      for (const field of orderByFields) {
        await service.execute({
          page: 1,
          orderBy: field as keyof UserProps,
        });

        expect(usersRepository.list).toHaveBeenCalledWith({
          page: 1,
          order: undefined,
          orderBy: field,
        });
      }
    });

    it('should return empty data array when no users exist', async () => {
      const mockResponse = {
        data: [],
        currentPage: 1,
        totalPages: 0,
      };

      usersRepository.list.mockResolvedValue(mockResponse);

      const result = await service.execute({ page: 1 });

      expect(result).toEqual({
        data: [],
        currentPage: 1,
        totalPages: 0,
      });
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      usersRepository.list.mockRejectedValue(error);

      await expect(service.execute({ page: 1 })).rejects.toThrow(
        'Database connection failed',
      );
      expect(usersRepository.list).toHaveBeenCalledWith({
        page: 1,
        order: undefined,
        orderBy: undefined,
      });
    });
  });
});
