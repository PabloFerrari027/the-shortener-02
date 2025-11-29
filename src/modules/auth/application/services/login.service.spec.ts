import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import type { HasherPort } from '@/shared/ports/hasher.port';
import { Bus } from 'src/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserNotFoundError } from 'src/modules/users/domain/errors/user-not-found.error';
import { UnauthorizedError } from '../../domain/erros/unauthorized.error';

describe('LoginService', () => {
  let service: LoginService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let sessionsRepository: jest.Mocked<SessionsRepository>;
  let encodingPort: jest.Mocked<EncodingPort>;
  let hasherPort: jest.Mocked<HasherPort>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: { value: 'hashed-password' },
    pullEvents: jest.fn().mockReturnValue([]),
  } as unknown as User;

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    pullEvents: jest.fn().mockReturnValue([]),
  } as unknown as Session;

  beforeEach(async () => {
    const usersRepositoryMock = {
      findByEmail: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
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
        LoginService,
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

    service = module.get<LoginService>(LoginService);
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
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      const mockAccessToken = 'encoded-access-token';
      const mockRefreshToken = 'encoded-refresh-token';
      const mockSessionId = 'generated-session-id';

      usersRepository.findByEmail.mockResolvedValue(mockUser);
      hasherPort.compare.mockResolvedValue(true);
      encodingPort.encode
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      jest.spyOn(Session, 'generateId').mockReturnValue(mockSessionId);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      const result = await service.execute(validInput);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(hasherPort.compare).toHaveBeenCalledWith(
        validInput.password,
        mockUser.password.value,
      );
      expect(Session.generateId).toHaveBeenCalled();
      expect(Session.create).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(encodingPort.encode).toHaveBeenCalledTimes(2);
      expect(usersRepository.update).toHaveBeenCalledWith(mockUser);
      expect(sessionsRepository.create).toHaveBeenCalledWith(mockSession);
      expect(Bus.dispatch).toHaveBeenCalledTimes(2);
      expect(Bus.dispatch).toHaveBeenCalledWith([]);
      expect(result).toEqual({
        session: mockSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        UserNotFoundError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new UserNotFoundError(validInput.email),
      );
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(hasherPort.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when password is invalid', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      hasherPort.compare.mockResolvedValue(false);

      await expect(service.execute(validInput)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        validInput.email,
      );
      expect(hasherPort.compare).toHaveBeenCalledWith(
        validInput.password,
        mockUser.password.value,
      );
      expect(encodingPort.encode).not.toHaveBeenCalled();
      expect(sessionsRepository.create).not.toHaveBeenCalled();
    });

    it('should generate correct token expiration times', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';
      const mockSessionId = 'session-id';
      const currentDate = new Date('2024-01-01T12:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      usersRepository.findByEmail.mockResolvedValue(mockUser);
      hasherPort.compare.mockResolvedValue(true);
      encodingPort.encode
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      jest.spyOn(Session, 'generateId').mockReturnValue(mockSessionId);
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
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

    it('should dispatch events from both user and session', async () => {
      const userEvents = [{ type: 'UserLoggedIn' }];
      const sessionEvents = [{ type: 'SessionCreated' }];

      const mockUserWithEvents: User = {
        ...mockUser,
        pullEvents: jest.fn().mockReturnValue(userEvents),
      } as unknown as User;

      const mockSessionWithEvents: Session = {
        ...mockSession,
        pullEvents: jest.fn().mockReturnValue(sessionEvents),
      } as unknown as Session;

      usersRepository.findByEmail.mockResolvedValue(mockUserWithEvents);
      hasherPort.compare.mockResolvedValue(true);
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      jest.spyOn(Session, 'generateId').mockReturnValue('session-id');
      jest.spyOn(Session, 'create').mockReturnValue(mockSessionWithEvents);

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

      usersRepository.findByEmail.mockResolvedValue(mockUser);
      hasherPort.compare.mockResolvedValue(true);
      encodingPort.encode
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      usersRepository.update.mockImplementation(async () => {
        callOrder.push('usersRepository.update');
      });

      sessionsRepository.create.mockImplementation(async () => {
        callOrder.push('sessionsRepository.create');
      });

      jest.spyOn(Session, 'generateId').mockReturnValue('session-id');
      jest.spyOn(Session, 'create').mockReturnValue(mockSession);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(callOrder).toEqual([
        'usersRepository.update',
        'sessionsRepository.create',
      ]);
    });
  });
});
