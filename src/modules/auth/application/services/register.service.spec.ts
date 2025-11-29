import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import type { HasherPort } from '@/shared/ports/hasher.port';
import { Bus } from '@/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';
import { User, UserRole } from 'src/modules/users/domain/entities/user.entity';
import { UserAlreadyExistsError } from '../../../users/domain/errors/user-already-exists.error';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Password } from '@/modules/users/domain/value-objects/password.value-object';

describe('RegisterService', () => {
  let service: RegisterService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let sessionsRepository: jest.Mocked<SessionsRepository>;
  let encodingPort: jest.Mocked<EncodingPort>;
  let hasherPort: jest.Mocked<HasherPort>;

  const mockUser: User = {
    id: 'user-123',
    name: { value: 'John Doe' },
    email: { value: 'john@example.com' },
    password: { value: 'hashed-password' },
    role: UserRole.CLINET,
    pullEvents: jest.fn().mockReturnValue([]),
  } as unknown as User;

  beforeEach(async () => {
    const usersRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      delete: jest.fn(),
    };

    const sessionsRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const encodingPortMock = {
      encode: jest.fn(),
      dencode: jest.fn(),
    };

    const hasherPortMock = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: 'UsersRepository',
          useValue: usersRepositoryMock,
        },
        {
          provide: 'SessionsRepository',
          useValue: sessionsRepositoryMock,
        },
        {
          provide: 'EncodingPort',
          useValue: encodingPortMock,
        },
        {
          provide: 'HasherPort',
          useValue: hasherPortMock,
        },
      ],
    }).compile();

    service = module.get<RegisterService>(RegisterService);
    usersRepository = module.get('UsersRepository');
    sessionsRepository = module.get('SessionsRepository');
    encodingPort = module.get('EncodingPort');
    hasherPort = module.get('HasherPort');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const mockAccessToken = 'encoded-access-token';
      const mockRefreshToken = 'encoded-refresh-token';
      const mockSessionId = 'generated-session-id';
      const mockHashedPassword = 'hashed-password';

      const mockSession: Session = {
        id: mockSessionId,
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue(mockHashedPassword);
      encodingPort.encode
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: mockHashedPassword } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      const result = await service.execute(validInput);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(hasherPort.hash).toHaveBeenCalledWith(validInput.password);
      expect(Name.create).toHaveBeenCalledWith(validInput.name);
      expect(Email.create).toHaveBeenCalledWith(validInput.email);
      expect(Password.create).toHaveBeenCalledWith(mockHashedPassword);
      expect(User.create).toHaveBeenCalledWith({
        name: { value: validInput.name },
        email: { value: validInput.email },
        password: { value: mockHashedPassword },
        role: UserRole.CLINET,
      });
      expect(Session.create).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(encodingPort.encode).toHaveBeenCalledTimes(2);
      expect(usersRepository.create).toHaveBeenCalledWith(mockUser);
      expect(sessionsRepository.create).toHaveBeenCalledWith(mockSession);
      expect(Bus.dispatch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        session: mockSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw UserAlreadyExistsError when user already exists', async () => {
      const existingUser: User = {
        id: 'existing-user-id',
        email: { value: validInput.email },
      } as unknown as User;

      usersRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.execute(validInput)).rejects.toThrow(
        UserAlreadyExistsError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new UserAlreadyExistsError(validInput.email),
      );
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(hasherPort.hash).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(sessionsRepository.create).not.toHaveBeenCalled();
    });

    it('should hash the password before creating user', async () => {
      const mockHashedPassword = 'super-secure-hashed-password';
      const mockSession: Session = {
        id: 'session-123',
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue(mockHashedPassword);
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: mockHashedPassword } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(hasherPort.hash).toHaveBeenCalledWith(validInput.password);
      expect(Password.create).toHaveBeenCalledWith(mockHashedPassword);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: { value: mockHashedPassword },
        }),
      );
    });

    it('should generate correct token expiration times', async () => {
      const currentDate = new Date('2024-01-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockSessionId = 'session-id';

      const mockSession: Session = {
        id: mockSessionId,
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue('hashed-password');
      encodingPort.encode
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: 'hashed' } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      const accessTokenCall = encodingPort.encode.mock.calls[0][0];
      const refreshTokenCall = encodingPort.encode.mock.calls[1][0];

      const accessTokenPayload = JSON.parse(accessTokenCall) as {
        sessionId: string;
        expiresAt: string;
      };
      const refreshTokenPayload = JSON.parse(refreshTokenCall) as {
        sessionId: string;
        expiresAt: string;
      };

      const expectedAccessExpiry = new Date(currentDate);
      expectedAccessExpiry.setHours(expectedAccessExpiry.getHours() + 1);

      const expectedRefreshExpiry = new Date(currentDate);
      expectedRefreshExpiry.setMonth(expectedRefreshExpiry.getMonth() + 1);

      expect(accessTokenPayload.sessionId).toBe(mockSessionId);
      expect(new Date(accessTokenPayload.expiresAt).toISOString()).toBe(
        expectedAccessExpiry.toISOString(),
      );
      expect(refreshTokenPayload.sessionId).toBe(mockSessionId);
      expect(new Date(refreshTokenPayload.expiresAt).toISOString()).toBe(
        expectedRefreshExpiry.toISOString(),
      );

      jest.useRealTimers();
    });

    it('should create user with CLINET role', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue('hashed-password');
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const userCreateSpy = jest
        .spyOn(User, 'create')
        .mockReturnValue(mockUser);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: 'hashed' } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(userCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CLINET,
        }),
      );
    });

    it('should dispatch events from both user and session', async () => {
      const userEvents = [{ type: 'UserCreated' }];
      const sessionEvents = [{ type: 'SessionCreated' }];

      const mockUserWithEvents: User = {
        ...mockUser,
        pullEvents: jest.fn().mockReturnValue(userEvents),
      } as unknown as User;

      const mockSessionWithEvents: Session = {
        id: 'session-123',
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue(sessionEvents),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue('hashed-password');
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      jest.spyOn(User, 'create').mockReturnValue(mockUserWithEvents);
      jest.spyOn(Session, 'create').mockReturnValue(mockSessionWithEvents);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: 'hashed' } as Password);

      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenNthCalledWith(1, sessionEvents);
      expect(dispatchSpy).toHaveBeenNthCalledWith(2, userEvents);
      expect(mockSessionWithEvents.pullEvents).toHaveBeenCalled();
      expect(mockUserWithEvents.pullEvents).toHaveBeenCalled();
    });

    it('should call repositories in correct order', async () => {
      const callOrder: string[] = [];
      const mockSession: Session = {
        id: 'session-123',
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue('hashed-password');
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      usersRepository.create.mockImplementation(async () => {
        callOrder.push('usersRepository.create');
      });

      sessionsRepository.create.mockImplementation(async () => {
        callOrder.push('sessionsRepository.create');
      });

      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: 'hashed' } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(callOrder).toEqual([
        'usersRepository.create',
        'sessionsRepository.create',
      ]);
    });

    it('should create session with user id', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue('hashed-password');
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const sessionCreateSpy = jest
        .spyOn(Session, 'create')
        .mockReturnValue(mockSession);
      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: 'hashed' } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(sessionCreateSpy).toHaveBeenCalledWith({ userId: mockUser.id });
    });

    it('should use same session id for both tokens', async () => {
      const mockSessionId = 'unique-session-id-123';
      const mockSession: Session = {
        id: mockSessionId,
        userId: mockUser.id,
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(null);
      hasherPort.hash.mockResolvedValue('hashed-password');
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      jest.spyOn(User, 'create').mockReturnValue(mockUser);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest
        .spyOn(Name, 'create')
        .mockReturnValue({ value: validInput.name } as Name);
      jest
        .spyOn(Email, 'create')
        .mockReturnValue({ value: validInput.email } as Email);
      jest
        .spyOn(Password, 'create')
        .mockReturnValue({ value: 'hashed' } as Password);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      const accessTokenCall = encodingPort.encode.mock.calls[0][0];
      const refreshTokenCall = encodingPort.encode.mock.calls[1][0];

      const accessTokenPayload = JSON.parse(accessTokenCall) as {
        sessionId: string;
      };
      const refreshTokenPayload = JSON.parse(refreshTokenCall) as {
        sessionId: string;
      };

      expect(accessTokenPayload.sessionId).toBe(mockSessionId);
      expect(refreshTokenPayload.sessionId).toBe(mockSessionId);
      expect(accessTokenPayload.sessionId).toBe(refreshTokenPayload.sessionId);
    });
  });
});
