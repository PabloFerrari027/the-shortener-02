import { Test, TestingModule } from '@nestjs/testing';
import { LogoutService } from './logout.service';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { SessionNotFoundError } from '../../domain/erros/session-not-found.error';
import { Bus } from '@/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';

describe('LogoutService', () => {
  let service: LogoutService;
  let sessionsRepository: jest.Mocked<SessionsRepository>;

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    close: jest.fn(),
    pullEvents: jest.fn().mockReturnValue([]),
  } as unknown as Session;

  beforeEach(async () => {
    const sessionsRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        {
          provide: 'SessionsRepository',
          useValue: sessionsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<LogoutService>(LogoutService);
    sessionsRepository = module.get('SessionsRepository');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      sessionId: 'session-123',
    };

    it('should successfully logout and close session', async () => {
      const mockSessionWithClose = {
        ...mockSession,
        close: jest.fn(),
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      sessionsRepository.findById.mockResolvedValue(mockSessionWithClose);
      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(sessionsRepository.findById).toHaveBeenCalledWith(
        validInput.sessionId,
      );
      expect(mockSessionWithClose.close).toHaveBeenCalledTimes(1);
      expect(mockSessionWithClose.pullEvents).toHaveBeenCalledTimes(1);
      expect(Bus.dispatch).toHaveBeenCalledWith([]);
      expect(sessionsRepository.update).toHaveBeenCalledWith(
        mockSessionWithClose,
      );
    });

    it('should throw SessionNotFoundError when session does not exist', async () => {
      sessionsRepository.findById.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        SessionNotFoundError,
      );
      await expect(service.execute(validInput)).rejects.toThrow(
        new SessionNotFoundError(validInput.sessionId),
      );
      expect(sessionsRepository.findById).toHaveBeenCalledWith(
        validInput.sessionId,
      );
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should dispatch session events before updating', async () => {
      const sessionEvents = [
        { type: 'SessionClosed', sessionId: 'session-123' },
      ];

      const mockSessionWithEvents: Session = {
        ...mockSession,
        close: jest.fn(),
        pullEvents: jest.fn().mockReturnValue(sessionEvents),
      } as unknown as Session;

      sessionsRepository.findById.mockResolvedValue(mockSessionWithEvents);
      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(mockSessionWithEvents.close).toHaveBeenCalled();
      expect(mockSessionWithEvents.pullEvents).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith(sessionEvents);
      expect(sessionsRepository.update).toHaveBeenCalledWith(
        mockSessionWithEvents,
      );
    });

    it('should call methods in correct order', async () => {
      const callOrder: string[] = [];

      const mockSessionWithTracking: Session = {
        ...mockSession,
        close: jest.fn().mockImplementation(() => {
          callOrder.push('session.close');
        }),
        pullEvents: jest.fn().mockImplementation(() => {
          callOrder.push('session.pullEvents');
          return [];
        }),
      } as unknown as Session;

      sessionsRepository.findById.mockResolvedValue(mockSessionWithTracking);

      jest.spyOn(Bus, 'dispatch').mockImplementation(async () => {
        callOrder.push('Bus.dispatch');
      });

      sessionsRepository.update.mockImplementation(async () => {
        callOrder.push('sessionsRepository.update');
      });

      await service.execute(validInput);

      expect(callOrder).toEqual([
        'session.close',
        'session.pullEvents',
        'Bus.dispatch',
        'sessionsRepository.update',
      ]);
    });

    it('should not call close or update if session is not found', async () => {
      const closeSpy = jest.fn();
      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      sessionsRepository.findById.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        SessionNotFoundError,
      );
      expect(closeSpy).not.toHaveBeenCalled();
      expect(sessionsRepository.update).not.toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should handle empty events array', async () => {
      const mockSessionNoEvents: Session = {
        ...mockSession,
        close: jest.fn(),
        pullEvents: jest.fn().mockReturnValue([]),
      } as unknown as Session;

      sessionsRepository.findById.mockResolvedValue(mockSessionNoEvents);
      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(dispatchSpy).toHaveBeenCalledWith([]);
      expect(sessionsRepository.update).toHaveBeenCalledWith(
        mockSessionNoEvents,
      );
    });

    it('should handle multiple events', async () => {
      const sessionEvents = [
        { type: 'SessionClosed', sessionId: 'session-123' },
        { type: 'UserLoggedOut', userId: 'user-123' },
        { type: 'AuditLog', action: 'logout' },
      ];

      const mockSessionMultipleEvents: Session = {
        ...mockSession,
        close: jest.fn(),
        pullEvents: jest.fn().mockReturnValue(sessionEvents),
      } as unknown as Session;

      sessionsRepository.findById.mockResolvedValue(mockSessionMultipleEvents);
      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(dispatchSpy).toHaveBeenCalledWith(sessionEvents);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
