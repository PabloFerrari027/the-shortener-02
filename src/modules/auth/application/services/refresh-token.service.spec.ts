import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import { UnauthorizedError } from '../../domain/erros/unauthorized.error';
import { Bus } from '@/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let sessionsRepository: jest.Mocked<SessionsRepository>;
  let encodingPort: jest.Mocked<EncodingPort>;

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    pullEvents: jest.fn().mockReturnValue([]),
  } as unknown as Session;

  beforeEach(async () => {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: 'SessionsRepository',
          useValue: sessionsRepositoryMock,
        },
        {
          provide: 'EncodingPort',
          useValue: encodingPortMock,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    sessionsRepository = module.get('SessionsRepository');
    encodingPort = module.get('EncodingPort');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      accessToken: 'encoded-access-token',
      refreshToken: 'encoded-refresh-token',
    };

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    const validAccessTokenPayload = {
      sessionId: 'session-123',
      expiresAt: futureDate.toISOString(),
    };

    const validRefreshTokenPayload = {
      sessionId: 'session-123',
      expiresAt: futureDate.toISOString(),
    };

    it('should successfully refresh tokens with valid credentials', async () => {
      const currentDate = new Date('2024-01-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const newAccessToken = 'new-encoded-access-token';
      const newRefreshToken = 'new-encoded-refresh-token';

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(validRefreshTokenPayload));

      sessionsRepository.findById.mockResolvedValue(mockSession);

      encodingPort.encode
        .mockResolvedValueOnce(newAccessToken)
        .mockResolvedValueOnce(newRefreshToken);

      jest.spyOn(Bus, 'dispatch').mockResolvedValue(undefined);

      const result = await service.execute(validInput);

      expect(encodingPort.dencode).toHaveBeenCalledWith(validInput.accessToken);
      expect(encodingPort.dencode).toHaveBeenCalledWith(
        validInput.refreshToken,
      );
      expect(sessionsRepository.findById).toHaveBeenCalledWith(
        validAccessTokenPayload.sessionId,
      );
      expect(encodingPort.encode).toHaveBeenCalledTimes(2);
      expect(sessionsRepository.update).toHaveBeenCalledWith(mockSession);
      expect(Bus.dispatch).toHaveBeenCalledWith([]);
      expect(result).toEqual({
        session: mockSession,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      jest.useRealTimers();
    });

    it('should throw UnauthorizedError when refresh token is expired', async () => {
      const currentDate = new Date('2024-01-01T12:00:00Z');
      const expiredDate = new Date('2023-12-01T12:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const expiredRefreshTokenPayload = {
        sessionId: 'session-123',
        expiresAt: expiredDate.toISOString(),
      };

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(expiredRefreshTokenPayload));

      await expect(service.execute(validInput)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(encodingPort.dencode).toHaveBeenCalledTimes(2);
      expect(sessionsRepository.findById).not.toHaveBeenCalled();
      expect(encodingPort.encode).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should throw UnauthorizedError when session IDs do not match', async () => {
      const mismatchedAccessTokenPayload = {
        sessionId: 'session-123',
        expiresAt: futureDate.toISOString(),
      };

      const mismatchedRefreshTokenPayload = {
        sessionId: 'session-456',
        expiresAt: futureDate.toISOString(),
      };

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(mismatchedAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(mismatchedRefreshTokenPayload));

      await expect(service.execute(validInput)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(encodingPort.dencode).toHaveBeenCalledTimes(2);
      expect(sessionsRepository.findById).not.toHaveBeenCalled();
      expect(encodingPort.encode).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when session is not found', async () => {
      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(validRefreshTokenPayload));

      sessionsRepository.findById.mockResolvedValue(null);

      await expect(service.execute(validInput)).rejects.toThrow(
        UnauthorizedError,
      );
      expect(sessionsRepository.findById).toHaveBeenCalledWith(
        validAccessTokenPayload.sessionId,
      );
      expect(encodingPort.encode).not.toHaveBeenCalled();
      expect(sessionsRepository.update).not.toHaveBeenCalled();
    });

    it('should generate new tokens with correct expiration times', async () => {
      const currentDate = new Date('2024-01-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(validRefreshTokenPayload));

      sessionsRepository.findById.mockResolvedValue(mockSession);

      encodingPort.encode
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

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

      expect(accessTokenPayload.sessionId).toBe(mockSession.id);
      expect(new Date(accessTokenPayload.expiresAt).toISOString()).toBe(
        expectedAccessExpiry.toISOString(),
      );
      expect(refreshTokenPayload.sessionId).toBe(mockSession.id);
      expect(new Date(refreshTokenPayload.expiresAt).toISOString()).toBe(
        expectedRefreshExpiry.toISOString(),
      );

      jest.useRealTimers();
    });

    it('should dispatch session events after update', async () => {
      const sessionEvents = [
        { type: 'TokenRefreshed', sessionId: 'session-123' },
      ];

      const mockSessionWithEvents: Session = {
        ...mockSession,
        pullEvents: jest.fn().mockReturnValue(sessionEvents),
      } as unknown as Session;

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(validRefreshTokenPayload));

      sessionsRepository.findById.mockResolvedValue(mockSessionWithEvents);

      encodingPort.encode
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const dispatchSpy = jest
        .spyOn(Bus, 'dispatch')
        .mockResolvedValue(undefined);

      await service.execute(validInput);

      expect(mockSessionWithEvents.pullEvents).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledWith(sessionEvents);
      expect(sessionsRepository.update).toHaveBeenCalledWith(
        mockSessionWithEvents,
      );
    });

    it('should call methods in correct order', async () => {
      const callOrder: string[] = [];

      encodingPort.dencode.mockImplementation(async (token) => {
        callOrder.push(`dencode:${token}`);
        if (token === validInput.accessToken) {
          return JSON.stringify(validAccessTokenPayload);
        }
        return JSON.stringify(validRefreshTokenPayload);
      });

      sessionsRepository.findById.mockImplementation(async () => {
        callOrder.push('findById');
        return mockSession;
      });

      encodingPort.encode.mockImplementation(async () => {
        callOrder.push('encode');
        return 'encoded-token';
      });

      sessionsRepository.update.mockImplementation(async () => {
        callOrder.push('update');
      });

      jest.spyOn(Bus, 'dispatch').mockImplementation(async () => {
        callOrder.push('dispatch');
      });

      await service.execute(validInput);

      expect(callOrder).toEqual([
        `dencode:${validInput.accessToken}`,
        `dencode:${validInput.refreshToken}`,
        'findById',
        'encode',
        'encode',
        'update',
        'dispatch',
      ]);
    });

    it('should validate refresh token expiration before checking session IDs', async () => {
      const currentDate = new Date('2024-01-01T12:00:00Z');
      const expiredDate = new Date('2023-12-01T12:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const expiredRefreshTokenPayload = {
        sessionId: 'different-session-id',
        expiresAt: expiredDate.toISOString(),
      };

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(expiredRefreshTokenPayload));

      await expect(service.execute(validInput)).rejects.toThrow(
        UnauthorizedError,
      );

      expect(sessionsRepository.findById).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle edge case where refresh token expires exactly at current time', async () => {
      const currentDate = new Date('2024-01-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(currentDate);

      const exactExpiryRefreshTokenPayload = {
        sessionId: 'session-123',
        expiresAt: currentDate.toISOString(),
      };

      encodingPort.dencode
        .mockResolvedValueOnce(JSON.stringify(validAccessTokenPayload))
        .mockResolvedValueOnce(JSON.stringify(exactExpiryRefreshTokenPayload));

      await expect(service.execute(validInput)).rejects.toThrow(
        UnauthorizedError,
      );

      jest.useRealTimers();
    });
  });
});
