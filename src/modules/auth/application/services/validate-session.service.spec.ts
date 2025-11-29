import { Test, TestingModule } from '@nestjs/testing';
import { ValidateSessionService } from './validate-session.service';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import type { CodeValidationRepository } from '../../domain/repositories/code-validation.repository';
import { CodeValidationNotFoundError } from '../../domain/erros/code-validation-not-found.error';
import { SessionNotFoundError } from '../../domain/erros/session-not-found.error';
import { CodeValidationExpiredError } from '../../domain/erros/code-validation-expired.error';
import { SessionAlreadyValidatedError } from '../../domain/erros/session-alredy-validated.error';
import { CodeDoesNotBelongToSessionError } from '../../domain/erros/code-does-not-belong-to-session.error';
import { Bus } from '@/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';
import { CodeValidation } from '../../domain/entities/code-validation.entity';
import { BaseEvent } from '@/shared/common/base-event';

describe('ValidateSessionService', () => {
  let service: ValidateSessionService;
  let sessionsRepository: jest.Mocked<SessionsRepository>;
  let codeValidationRepository: jest.Mocked<CodeValidationRepository>;

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    validatedAt: null,
    validate: jest.fn(),
    pullEvents: jest.fn().mockReturnValue([]),
  } as unknown as Session;

  const createMockCodeValidation = (overrides = {}): CodeValidation => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const mockCodeValidation = CodeValidation.create({
      sessionId: 'session-123',
      value: '123456',
    });

    if (overrides) {
      Object.assign(mockCodeValidation, overrides);
    }

    return mockCodeValidation;
  };

  beforeEach(async () => {
    const sessionsRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const codeValidationRepositoryMock = {
      findByValue: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateSessionService,
        {
          provide: 'SessionsRepository',
          useValue: sessionsRepositoryMock,
        },
        {
          provide: 'CodeValidationRepository',
          useValue: codeValidationRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ValidateSessionService>(ValidateSessionService);
    sessionsRepository = module.get('SessionsRepository');
    codeValidationRepository = module.get('CodeValidationRepository');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      code: '123456',
      sessionId: 'session-123',
    };

    it('should successfully validate session with valid code', async () => {
      const mockCodeValidation = createMockCodeValidation();
      const mockSessionWithValidate: Session = {
        ...mockSession,
        validatedAt: null,
        validate: jest.fn(),
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(mockSessionWithValidate);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(codeValidationRepository.findByValue).toHaveBeenCalledWith(
        validInput.code,
      );
      expect(sessionsRepository.findById).toHaveBeenCalledWith(
        validInput.sessionId,
      );
      expect(mockSessionWithValidate.validate).toHaveBeenCalled();
      expect(sessionsRepository.update).toHaveBeenCalledWith(
        mockSessionWithValidate,
      );
      expect(Bus.dispatch).toHaveBeenCalledTimes(2);
    });

    it('should throw CodeValidationNotFoundError when code does not exist', async () => {
      codeValidationRepository.findByValue.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        CodeValidationNotFoundError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new CodeValidationNotFoundError(validInput.code),
      );
      expect(codeValidationRepository.findByValue).toHaveBeenCalledWith(
        validInput.code,
      );
      expect(sessionsRepository.findById).not.toHaveBeenCalled();
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw CodeValidationExpiredError when code is expired', async () => {
      const mockCodeValidation = createMockCodeValidation();
      jest.spyOn(mockCodeValidation, 'isExpired').mockReturnValue(true);

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );

      await expect(service.execute(validInput)).rejects.toThrow(
        CodeValidationExpiredError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new CodeValidationExpiredError(validInput.code),
      );
      expect(codeValidationRepository.findByValue).toHaveBeenCalledWith(
        validInput.code,
      );
      expect(mockCodeValidation.isExpired).toHaveBeenCalled();
      expect(sessionsRepository.findById).not.toHaveBeenCalled();
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw SessionNotFoundError when session does not exist', async () => {
      const mockCodeValidation = createMockCodeValidation();

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        SessionNotFoundError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new SessionNotFoundError(validInput.sessionId),
      );
      expect(codeValidationRepository.findByValue).toHaveBeenCalledWith(
        validInput.code,
      );
      expect(sessionsRepository.findById).toHaveBeenCalledWith(
        validInput.sessionId,
      );
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw SessionAlreadyValidatedError when session is already validated', async () => {
      const mockCodeValidation = createMockCodeValidation();
      const validatedSession: Session = {
        ...mockSession,
        validatedAt: new Date('2024-01-01T12:00:00Z'),
      } as unknown as Session;

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(validatedSession);

      await expect(service.execute(validInput)).rejects.toThrow(
        SessionAlreadyValidatedError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new SessionAlreadyValidatedError(validInput.sessionId),
      );
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should throw CodeDoesNotBelongToSessionError when session IDs do not match', async () => {
      const mockCodeValidation = CodeValidation.create({
        sessionId: 'different-session-id',
        value: '123456',
      });

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(mockSession);

      await expect(service.execute(validInput)).rejects.toThrow(
        CodeDoesNotBelongToSessionError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new CodeDoesNotBelongToSessionError(),
      );
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should dispatch events from both session and code validation', async () => {
      const sessionEvents = [
        { type: 'SessionValidated', sessionId: 'session-123' },
      ] as unknown as BaseEvent<unknown>[];

      const codeValidationEvents = [
        { type: 'CodeValidationUsed', code: '123456' },
      ] as unknown as BaseEvent<unknown>[];

      const mockCodeValidation = createMockCodeValidation();
      jest
        .spyOn(mockCodeValidation, 'pullEvents')
        .mockReturnValue(codeValidationEvents);

      const mockSessionWithEvents: Session = {
        ...mockSession,
        validatedAt: null,
        validate: jest.fn(),
        pullEvents: jest.fn().mockReturnValue(sessionEvents),
      } as unknown as Session;

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(mockSessionWithEvents);

      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(mockSessionWithEvents.pullEvents).toHaveBeenCalled();
      expect(mockCodeValidation.pullEvents).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenNthCalledWith(1, sessionEvents);
      expect(dispatchSpy).toHaveBeenNthCalledWith(2, codeValidationEvents);
    });

    it('should call methods in correct order', async () => {
      const callOrder: string[] = [];

      const mockCodeValidation = createMockCodeValidation();

      jest.spyOn(mockCodeValidation, 'isExpired').mockImplementation(() => {
        callOrder.push('codeValidation.isExpired');
        return false;
      });

      jest.spyOn(mockCodeValidation, 'pullEvents').mockImplementation(() => {
        callOrder.push('codeValidation.pullEvents');
        return [];
      });

      const mockSessionTracking: Session = {
        ...mockSession,
        validatedAt: null,
        validate: jest.fn().mockImplementation(() => {
          callOrder.push('session.validate');
        }),
        pullEvents: jest.fn().mockImplementation(() => {
          callOrder.push('session.pullEvents');
          return [];
        }),
      } as unknown as Session;

      codeValidationRepository.findByValue.mockImplementation(async () => {
        callOrder.push('findByValue');
        return mockCodeValidation;
      });

      sessionsRepository.findById.mockImplementation(async () => {
        callOrder.push('findById');
        return mockSessionTracking;
      });

      sessionsRepository.update.mockImplementation(async () => {
        callOrder.push('update');
      });

      jest.spyOn(Bus, 'dispatch').mockImplementation(async () => {
        callOrder.push('Bus.dispatch');
      });

      await service.execute(validInput);

      expect(callOrder).toEqual([
        'findByValue',
        'codeValidation.isExpired',
        'findById',
        'session.validate',
        'update',
        'session.pullEvents',
        'Bus.dispatch',
        'codeValidation.pullEvents',
        'Bus.dispatch',
      ]);
    });

    it('should check if code is expired before checking session', async () => {
      const mockCodeValidation = createMockCodeValidation();
      jest.spyOn(mockCodeValidation, 'isExpired').mockReturnValue(true);

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );

      await expect(service.execute(validInput)).rejects.toThrow(
        CodeValidationExpiredError,
      );
      expect(mockCodeValidation.isExpired).toHaveBeenCalled();
      expect(sessionsRepository.findById).not.toHaveBeenCalled();
    });

    it('should validate session existence before checking if already validated', async () => {
      const mockCodeValidation = createMockCodeValidation();

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        SessionNotFoundError,
      );
      expect(sessionsRepository.findById).toHaveBeenCalled();
    });

    it('should check session validation status before checking session ID match', async () => {
      const mockCodeValidation = createMockCodeValidation();
      Object.defineProperty(mockCodeValidation, 'sessionId', {
        get: () => 'different-session-id',
        configurable: true,
      });

      const validatedSession: Session = {
        ...mockSession,
        validatedAt: new Date(),
      } as unknown as Session;

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(validatedSession);

      await expect(service.execute(validInput)).rejects.toThrow(
        SessionAlreadyValidatedError,
      );
    });

    it('should not call validate or update if any validation fails', async () => {
      codeValidationRepository.findByValue.mockResolvedValue(null);

      const validateSpy = jest.fn();

      await expect(service.execute(validInput)).rejects.toThrow(
        CodeValidationNotFoundError,
      );
      expect(validateSpy).not.toHaveBeenCalled();
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should handle empty events arrays', async () => {
      const mockCodeValidation = createMockCodeValidation();
      jest.spyOn(mockCodeValidation, 'pullEvents').mockReturnValue([]);

      const mockSessionNoEvents: Session = {
        ...mockSession,
        validatedAt: null,
        validate: jest.fn(),
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      codeValidationRepository.findByValue.mockResolvedValue(
        mockCodeValidation,
      );
      sessionsRepository.findById.mockResolvedValue(mockSessionNoEvents);

      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenNthCalledWith(1, []);
      expect(dispatchSpy).toHaveBeenNthCalledWith(2, []);
    });
  });
});
