import { SendCodeValidationHandler } from './send-code-validation.handler';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import type { SessionsRepository } from 'src/modules/auth/domain/repositories/sessions.repository';
import type { CodeValidationRepository } from 'src/modules/auth/domain/repositories/code-validation.repository';
import type { NotificationPort } from '@/shared/ports/notification.port';
import type { VerificationCodeTemplate } from 'src/modules/auth/templates/verification-code.template';
import { UserNotFoundError } from 'src/modules/users/domain/errors/user-not-found.error';
import { SessionNotFoundError } from 'src/modules/auth/domain/erros/session-not-found.error';
import { CodeValidation } from 'src/modules/auth/domain/entities/code-validation.entity';
import { Session } from 'src/modules/auth/domain/entities/session.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Language } from 'src/modules/auth/templates/verification-code.template';

jest.mock('@/shared/env', () => ({
  Env: {
    TEMPLATE_LANGUAGE: 'PT-BR',
  },
}));

jest.mock('src/modules/auth/domain/entities/code-validation.entity');

describe('SendCodeValidationHandler', () => {
  let handler: SendCodeValidationHandler;
  let mockUsersRepository: jest.Mocked<UsersRepository>;
  let mockSessionsRepository: jest.Mocked<SessionsRepository>;
  let mockCodeValidationRepository: jest.Mocked<CodeValidationRepository>;
  let mockNotificationPort: jest.Mocked<NotificationPort>;
  let mockVerificationCodeTemplate: jest.Mocked<VerificationCodeTemplate>;

  const mockSession = {
    id: 'session-123',
    userId: 'user-456',
    createdAt: new Date('2024-01-01'),
  } as Session;

  const mockUser = {
    id: 'user-456',
    name: { value: 'John Doe' },
    email: { value: 'john.doe@example.com' },
  } as User;

  const mockCodeValidationEntity = {
    id: 'code-validation-789',
    sessionId: 'session-123',
    value: '123456',
    createdAt: new Date('2024-01-01'),
  } as CodeValidation;

  const mockTemplate = {
    head: 'Your verification code is 123456',
    body: 'Hello, John Doe!\nPlease use code 123456 to verify your email.',
  };

  beforeEach(() => {
    mockUsersRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UsersRepository>;

    mockSessionsRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<SessionsRepository>;

    mockCodeValidationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findByValue: jest.fn(),
    } as jest.Mocked<CodeValidationRepository>;

    mockNotificationPort = {
      send: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<NotificationPort>;

    mockVerificationCodeTemplate = {
      generate: jest.fn().mockReturnValue(mockTemplate),
    } as jest.Mocked<VerificationCodeTemplate>;

    (CodeValidation.generate as jest.Mock) = jest
      .fn()
      .mockReturnValue('123456');
    (CodeValidation.create as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockCodeValidationEntity);

    handler = new SendCodeValidationHandler(
      mockUsersRepository,
      mockSessionsRepository,
      mockCodeValidationRepository,
      mockNotificationPort,
      mockVerificationCodeTemplate,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully send verification code when session and user exist', async () => {
      const input = { sessionId: 'session-123' };
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockResolvedValue(
        mockCodeValidationEntity,
      );

      await handler.execute(input);

      expect(mockSessionsRepository.findById).toHaveBeenCalledWith(
        input.sessionId,
      );
      expect(mockUsersRepository.findById).toHaveBeenCalledWith(
        mockSession.userId,
      );
      expect(CodeValidation.generate).toHaveBeenCalled();
      expect(CodeValidation.create).toHaveBeenCalledWith({
        sessionId: mockSession.id,
        value: '123456',
      });
      expect(mockCodeValidationRepository.create).toHaveBeenCalledWith(
        mockCodeValidationEntity,
      );
      expect(mockVerificationCodeTemplate.generate).toHaveBeenCalledWith({
        code: mockCodeValidationEntity.value,
        language: Language['PT-BR'],
        userName: mockUser.name.value,
      });
      expect(mockNotificationPort.send).toHaveBeenCalledWith(
        mockUser.email.value,
        mockTemplate.head,
        mockTemplate.body,
      );
    });

    it('should throw SessionNotFoundError when session does not exist', async () => {
      const input = { sessionId: 'non-existent-session' };
      mockSessionsRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(input)).rejects.toThrow(
        SessionNotFoundError,
      );
      await expect(handler.execute(input)).rejects.toThrow(
        new SessionNotFoundError(input.sessionId),
      );
      expect(mockSessionsRepository.findById).toHaveBeenCalledWith(
        input.sessionId,
      );
      expect(mockUsersRepository.findById).not.toHaveBeenCalled();
      expect(mockCodeValidationRepository.create).not.toHaveBeenCalled();
      expect(mockNotificationPort.send).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      const input = { sessionId: 'session-123' };
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(input)).rejects.toThrow(UserNotFoundError);
      await expect(handler.execute(input)).rejects.toThrow(
        new UserNotFoundError(mockSession.userId),
      );
      expect(mockSessionsRepository.findById).toHaveBeenCalledWith(
        input.sessionId,
      );
      expect(mockUsersRepository.findById).toHaveBeenCalledWith(
        mockSession.userId,
      );
      expect(mockCodeValidationRepository.create).not.toHaveBeenCalled();
      expect(mockNotificationPort.send).not.toHaveBeenCalled();
    });

    it('should generate unique code validation for each execution', async () => {
      const input = { sessionId: 'session-123' };
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockResolvedValue(
        mockCodeValidationEntity,
      );

      await handler.execute(input);

      expect(CodeValidation.generate).toHaveBeenCalledTimes(1);
      expect(CodeValidation.create).toHaveBeenCalledWith({
        sessionId: mockSession.id,
        value: expect.any(String),
      });
    });

    it('should use correct template language from environment', async () => {
      const input = { sessionId: 'session-123' };
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockResolvedValue(
        mockCodeValidationEntity,
      );

      await handler.execute(input);

      expect(mockVerificationCodeTemplate.generate).toHaveBeenCalledWith({
        code: mockCodeValidationEntity.value,
        language: 'PT-BR',
        userName: mockUser.name.value,
      });
    });

    it('should send notification with correct parameters', async () => {
      const input = { sessionId: 'session-123' };
      const customTemplate = {
        head: 'Custom Head',
        body: 'Custom Body',
      };
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockResolvedValue(
        mockCodeValidationEntity,
      );
      mockVerificationCodeTemplate.generate.mockReturnValue(customTemplate);

      await handler.execute(input);

      expect(mockNotificationPort.send).toHaveBeenCalledWith(
        mockUser.email.value,
        customTemplate.head,
        customTemplate.body,
      );
      expect(mockNotificationPort.send).toHaveBeenCalledTimes(1);
    });

    it('should propagate error if sessionsRepository.findById fails', async () => {
      const input = { sessionId: 'session-123' };
      const error = new Error('Database error');
      mockSessionsRepository.findById.mockRejectedValue(error);

      await expect(handler.execute(input)).rejects.toThrow('Database error');
      expect(mockSessionsRepository.findById).toHaveBeenCalledWith(
        input.sessionId,
      );
      expect(mockUsersRepository.findById).not.toHaveBeenCalled();
    });

    it('should propagate error if usersRepository.findById fails', async () => {
      const input = { sessionId: 'session-123' };
      const error = new Error('Database error');
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockRejectedValue(error);

      await expect(handler.execute(input)).rejects.toThrow('Database error');
      expect(mockUsersRepository.findById).toHaveBeenCalledWith(
        mockSession.userId,
      );
      expect(mockCodeValidationRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate error if codeValidationRepository.create fails', async () => {
      const input = { sessionId: 'session-123' };
      const error = new Error('Failed to create code validation');
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockRejectedValue(error);

      await expect(handler.execute(input)).rejects.toThrow(
        'Failed to create code validation',
      );
      expect(mockCodeValidationRepository.create).toHaveBeenCalled();
      expect(mockNotificationPort.send).not.toHaveBeenCalled();
    });

    it('should propagate error if notificationPort.send fails', async () => {
      const input = { sessionId: 'session-123' };
      const error = new Error('Failed to send notification');
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockResolvedValue(
        mockCodeValidationEntity,
      );
      mockNotificationPort.send.mockRejectedValue(error);

      await expect(handler.execute(input)).rejects.toThrow(
        'Failed to send notification',
      );
      expect(mockNotificationPort.send).toHaveBeenCalled();
    });

    it('should handle multiple sequential executions', async () => {
      const input1 = { sessionId: 'session-1' };
      const input2 = { sessionId: 'session-2' };
      mockSessionsRepository.findById.mockResolvedValue(mockSession);
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockCodeValidationRepository.create.mockResolvedValue(
        mockCodeValidationEntity,
      );

      await handler.execute(input1);
      await handler.execute(input2);

      expect(mockSessionsRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockUsersRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockCodeValidationRepository.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationPort.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('constructor', () => {
    it('should extend BaseHandler', () => {
      expect(handler).toBeInstanceOf(SendCodeValidationHandler);
    });

    it('should initialize with all required dependencies', () => {
      expect(handler['usersRepository']).toBe(mockUsersRepository);
      expect(handler['sessionsRepository']).toBe(mockSessionsRepository);
      expect(handler['codeValidationRepository']).toBe(
        mockCodeValidationRepository,
      );
      expect(handler['notificationPort']).toBe(mockNotificationPort);
      expect(handler['verificationCodeTemplate']).toBe(
        mockVerificationCodeTemplate,
      );
    });
  });
});
