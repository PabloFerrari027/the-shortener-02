import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginService } from './services/login.service';
import { LogoutService } from './services/logout.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { ValidateSessionService } from './services/validate-session.service';
import { RegisterService } from './services/register.service';
import { Session } from '../domain/entities/session.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let loginService: jest.Mocked<LoginService>;
  let logoutService: jest.Mocked<LogoutService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;
  let validateSessionService: jest.Mocked<ValidateSessionService>;
  let registerService: jest.Mocked<RegisterService>;

  const createMockSession = (userId: string = 'user-123'): Session => {
    return Session.create({ userId });
  };

  const mockAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIxMjMiLCJleHBpcmVzQXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwLjAwMFoifQ.signature';
  const mockRefreshToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIxMjMiLCJleHBpcmVzQXQiOiIyMDI0LTAyLTAxVDAwOjAwOjAwLjAwMFoifQ.signature';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: LogoutService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ValidateSessionService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RegisterService,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    loginService = module.get(LoginService);
    logoutService = module.get(LogoutService);
    refreshTokenService = module.get(RefreshTokenService);
    validateSessionService = module.get(ValidateSessionService);
    registerService = module.get(RegisterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerBody = {
        name: 'Pablo',
        email: 'user@email.com',
        password: '123abc',
      };

      const mockSession = createMockSession();
      const mockServiceResponse = {
        session: mockSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      };

      registerService.execute.mockResolvedValue(mockServiceResponse);

      const result = await controller.register(registerBody);

      expect(registerService.execute).toHaveBeenCalledWith(registerBody);
      expect(registerService.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        session_id: mockSession.id,
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });
    });

    it('should throw error when user already exists', async () => {
      const registerBody = {
        name: 'Pablo',
        email: 'existing@email.com',
        password: '123abc',
      };

      const error = new Error('User already exists');
      registerService.execute.mockRejectedValue(error);

      await expect(controller.register(registerBody)).rejects.toThrow(error);
      expect(registerService.execute).toHaveBeenCalledWith(registerBody);
    });

    it('should return correct response structure', async () => {
      const registerBody = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockSession = createMockSession('user-456');
      registerService.execute.mockResolvedValue({
        session: mockSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = await controller.register(registerBody);

      expect(result).toHaveProperty('session_id');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(typeof result.session_id).toBe('string');
      expect(typeof result.access_token).toBe('string');
      expect(typeof result.refresh_token).toBe('string');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginBody = {
        email: 'user@email.com',
        password: '123abc',
      };

      const mockSession = createMockSession();
      const mockServiceResponse = {
        session: mockSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      };

      loginService.execute.mockResolvedValue(mockServiceResponse);

      const result = await controller.login(loginBody);

      expect(loginService.execute).toHaveBeenCalledWith(loginBody);
      expect(loginService.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        session_id: mockSession.id,
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });
    });

    it('should throw error when credentials are invalid', async () => {
      const loginBody = {
        email: 'user@email.com',
        password: 'wrongpassword',
      };

      const error = new Error('Unauthorized');
      loginService.execute.mockRejectedValue(error);

      await expect(controller.login(loginBody)).rejects.toThrow(error);
      expect(loginService.execute).toHaveBeenCalledWith(loginBody);
    });

    it('should throw error when user not found', async () => {
      const loginBody = {
        email: 'notfound@email.com',
        password: '123abc',
      };

      const error = new Error('User not found');
      loginService.execute.mockRejectedValue(error);

      await expect(controller.login(loginBody)).rejects.toThrow(error);
      expect(loginService.execute).toHaveBeenCalledWith(loginBody);
    });

    it('should return correct response structure', async () => {
      const loginBody = {
        email: 'user@email.com',
        password: '123abc',
      };

      const mockSession = createMockSession('user-789');
      loginService.execute.mockResolvedValue({
        session: mockSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = await controller.login(loginBody);

      expect(result).toHaveProperty('session_id');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });

  describe('validateCode', () => {
    it('should validate session successfully', async () => {
      const validateBody = {
        code: '123456',
        session_id: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
      };

      validateSessionService.execute.mockResolvedValue(undefined);

      const result = await controller.validateCode(validateBody);

      expect(validateSessionService.execute).toHaveBeenCalledWith({
        code: validateBody.code,
        sessionId: validateBody.session_id,
      });
      expect(validateSessionService.execute).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should throw error when code is invalid', async () => {
      const validateBody = {
        code: 'invalid',
        session_id: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
      };

      const error = new Error('Code validation not found');
      validateSessionService.execute.mockRejectedValue(error);

      await expect(controller.validateCode(validateBody)).rejects.toThrow(
        error,
      );
      expect(validateSessionService.execute).toHaveBeenCalledWith({
        code: validateBody.code,
        sessionId: validateBody.session_id,
      });
    });

    it('should throw error when code is expired', async () => {
      const validateBody = {
        code: '123456',
        session_id: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
      };

      const error = new Error('Code validation expired');
      validateSessionService.execute.mockRejectedValue(error);

      await expect(controller.validateCode(validateBody)).rejects.toThrow(
        error,
      );
    });

    it('should throw error when session not found', async () => {
      const validateBody = {
        code: '123456',
        session_id: 'non-existent-session',
      };

      const error = new Error('Session not found');
      validateSessionService.execute.mockRejectedValue(error);

      await expect(controller.validateCode(validateBody)).rejects.toThrow(
        error,
      );
    });

    it('should throw error when session already validated', async () => {
      const validateBody = {
        code: '123456',
        session_id: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
      };

      const error = new Error('Session already validated');
      validateSessionService.execute.mockRejectedValue(error);

      await expect(controller.validateCode(validateBody)).rejects.toThrow(
        error,
      );
    });

    it('should throw error when code does not belong to session', async () => {
      const validateBody = {
        code: '123456',
        session_id: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
      };

      const error = new Error('Code does not belong to session');
      validateSessionService.execute.mockRejectedValue(error);

      await expect(controller.validateCode(validateBody)).rejects.toThrow(
        error,
      );
    });

    it('should correctly map session_id to sessionId', async () => {
      const validateBody = {
        code: '654321',
        session_id: 'session-abc-123',
      };

      validateSessionService.execute.mockResolvedValue(undefined);

      await controller.validateCode(validateBody);

      expect(validateSessionService.execute).toHaveBeenCalledWith({
        code: '654321',
        sessionId: 'session-abc-123',
      });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshBody = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      };

      const mockSession = createMockSession();
      const newAccessToken = 'new_' + mockAccessToken;
      const newRefreshToken = 'new_' + mockRefreshToken;

      const mockServiceResponse = {
        session: mockSession,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

      refreshTokenService.execute.mockResolvedValue(mockServiceResponse);

      const result = await controller.refresh(refreshBody);

      expect(refreshTokenService.execute).toHaveBeenCalledWith({
        accessToken: refreshBody.access_token,
        refreshToken: refreshBody.refresh_token,
      });
      expect(refreshTokenService.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        session_id: mockSession.id,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });
    });

    it('should throw error when refresh token is expired', async () => {
      const refreshBody = {
        access_token: mockAccessToken,
        refresh_token: 'expired_token',
      };

      const error = new Error('Unauthorized');
      refreshTokenService.execute.mockRejectedValue(error);

      await expect(controller.refresh(refreshBody)).rejects.toThrow(error);
      expect(refreshTokenService.execute).toHaveBeenCalledWith({
        accessToken: refreshBody.access_token,
        refreshToken: refreshBody.refresh_token,
      });
    });

    it('should throw error when tokens session mismatch', async () => {
      const refreshBody = {
        access_token: mockAccessToken,
        refresh_token: 'different_session_token',
      };

      const error = new Error('Unauthorized');
      refreshTokenService.execute.mockRejectedValue(error);

      await expect(controller.refresh(refreshBody)).rejects.toThrow(error);
    });

    it('should throw error when session not found', async () => {
      const refreshBody = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      };

      const error = new Error('Unauthorized');
      refreshTokenService.execute.mockRejectedValue(error);

      await expect(controller.refresh(refreshBody)).rejects.toThrow(error);
    });

    it('should return correct response structure', async () => {
      const refreshBody = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      };

      const mockSession = createMockSession('user-refresh-test');
      refreshTokenService.execute.mockResolvedValue({
        session: mockSession,
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await controller.refresh(refreshBody);

      expect(result).toHaveProperty('session_id');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.session_id).toBe(mockSession.id);
    });

    it('should correctly map access_token to accessToken', async () => {
      const refreshBody = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
      };

      const mockSession = createMockSession();
      refreshTokenService.execute.mockResolvedValue({
        session: mockSession,
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });

      await controller.refresh(refreshBody);

      expect(refreshTokenService.execute).toHaveBeenCalledWith({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const logoutParam = {
        session_id: 'b7f9d2a3-4567-8901-abcd-ef2345678901',
      };

      logoutService.execute.mockResolvedValue(undefined);

      const result = await controller.logout(logoutParam);

      expect(logoutService.execute).toHaveBeenCalledWith({
        sessionId: logoutParam.session_id,
      });
      expect(logoutService.execute).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should throw error when session not found', async () => {
      const logoutParam = {
        session_id: 'non-existent-session',
      };

      const error = new Error('Session not found');
      logoutService.execute.mockRejectedValue(error);

      await expect(controller.logout(logoutParam)).rejects.toThrow(error);
      expect(logoutService.execute).toHaveBeenCalledWith({
        sessionId: logoutParam.session_id,
      });
    });

    it('should correctly map session_id to sessionId', async () => {
      const logoutParam = {
        session_id: 'session-xyz-789',
      };

      logoutService.execute.mockResolvedValue(undefined);

      await controller.logout(logoutParam);

      expect(logoutService.execute).toHaveBeenCalledWith({
        sessionId: 'session-xyz-789',
      });
    });

    it('should handle multiple logout calls independently', async () => {
      const logoutParam1 = { session_id: 'session-1' };
      const logoutParam2 = { session_id: 'session-2' };

      logoutService.execute.mockResolvedValue(undefined);

      await controller.logout(logoutParam1);
      await controller.logout(logoutParam2);

      expect(logoutService.execute).toHaveBeenCalledTimes(2);
      expect(logoutService.execute).toHaveBeenNthCalledWith(1, {
        sessionId: 'session-1',
      });
      expect(logoutService.execute).toHaveBeenNthCalledWith(2, {
        sessionId: 'session-2',
      });
    });
  });

  describe('Integration - Session entity usage', () => {
    it('should work with real Session entity in register', async () => {
      const registerBody = {
        name: 'Integration Test',
        email: 'integration@test.com',
        password: 'test123',
      };

      const realSession = Session.create({ userId: 'user-integration' });
      registerService.execute.mockResolvedValue({
        session: realSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = await controller.register(registerBody);

      expect(result.session_id).toBe(realSession.id);
      expect(result.access_token).toBe(mockAccessToken);
      expect(result.refresh_token).toBe(mockRefreshToken);
    });

    it('should work with real Session entity in login', async () => {
      const loginBody = {
        email: 'test@example.com',
        password: 'password',
      };

      const realSession = Session.create({ userId: 'user-real' });
      loginService.execute.mockResolvedValue({
        session: realSession,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      const result = await controller.login(loginBody);

      expect(result.session_id).toBe(realSession.id);
    });

    it('should work with real Session entity in refresh', async () => {
      const refreshBody = {
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      };

      const realSession = Session.create({ userId: 'user-refresh' });
      refreshTokenService.execute.mockResolvedValue({
        session: realSession,
        accessToken: 'new_token',
        refreshToken: 'new_refresh',
      });

      const result = await controller.refresh(refreshBody);

      expect(result.session_id).toBe(realSession.id);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from register service', async () => {
      const error = new Error('Database connection failed');
      registerService.execute.mockRejectedValue(error);

      await expect(
        controller.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'pass',
        }),
      ).rejects.toThrow('Database connection failed');
    });

    it('should propagate errors from login service', async () => {
      const error = new Error('Invalid credentials');
      loginService.execute.mockRejectedValue(error);

      await expect(
        controller.login({
          email: 'test@test.com',
          password: 'wrong',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should propagate errors from validate session service', async () => {
      const error = new Error('Validation failed');
      validateSessionService.execute.mockRejectedValue(error);

      await expect(
        controller.validateCode({
          code: '123456',
          session_id: 'session-id',
        }),
      ).rejects.toThrow('Validation failed');
    });

    it('should propagate errors from refresh token service', async () => {
      const error = new Error('Token refresh failed');
      refreshTokenService.execute.mockRejectedValue(error);

      await expect(
        controller.refresh({
          access_token: 'token',
          refresh_token: 'refresh',
        }),
      ).rejects.toThrow('Token refresh failed');
    });

    it('should propagate errors from logout service', async () => {
      const error = new Error('Logout failed');
      logoutService.execute.mockRejectedValue(error);

      await expect(
        controller.logout({ session_id: 'session-id' }),
      ).rejects.toThrow('Logout failed');
    });
  });
});
