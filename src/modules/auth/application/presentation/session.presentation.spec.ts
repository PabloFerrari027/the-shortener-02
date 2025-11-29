import { SessionPresentation, ToControllerInput } from './session.presentation';
import { Session } from '../../domain/entities/session.entity';

describe('SessionPresentation', () => {
  describe('toController', () => {
    it('should transform input to controller output with correct property mapping', () => {
      const mockSession: Session = {
        id: 'session-123',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: 'access-token-abc',
        refreshToken: 'refresh-token-xyz',
      };

      const result = SessionPresentation.toController(input);

      expect(result).toEqual({
        session_id: 'session-123',
        access_token: 'access-token-abc',
        refresh_token: 'refresh-token-xyz',
      });
    });

    it('should correctly map session.id to session_id', () => {
      const mockSession: Session = {
        id: 'unique-session-id',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: 'token-1',
        refreshToken: 'token-2',
      };

      const result = SessionPresentation.toController(input);

      expect(result.session_id).toBe('unique-session-id');
      expect(result.session_id).toBe(input.session.id);
    });

    it('should correctly map accessToken to access_token', () => {
      const mockSession: Session = {
        id: 'session-id',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: 'my-access-token',
        refreshToken: 'my-refresh-token',
      };

      const result = SessionPresentation.toController(input);

      expect(result.access_token).toBe('my-access-token');
      expect(result.access_token).toBe(input.accessToken);
    });

    it('should correctly map refreshToken to refresh_token', () => {
      const mockSession: Session = {
        id: 'session-id',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: 'access',
        refreshToken: 'my-refresh-token',
      };

      const result = SessionPresentation.toController(input);

      expect(result.refresh_token).toBe('my-refresh-token');
      expect(result.refresh_token).toBe(input.refreshToken);
    });

    it('should handle empty string values correctly', () => {
      const mockSession: Session = {
        id: '',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: '',
        refreshToken: '',
      };

      const result = SessionPresentation.toController(input);

      expect(result).toEqual({
        session_id: '',
        access_token: '',
        refresh_token: '',
      });
    });

    it('should create a new object and not mutate input', () => {
      const mockSession: Session = {
        id: 'session-123',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      const inputCopy = { ...input };

      const result = SessionPresentation.toController(input);

      expect(input).toEqual(inputCopy);
      expect(result).not.toBe(input);
    });

    it('should return object with only expected properties', () => {
      const mockSession: Session = {
        id: 'session-123',
      } as Session;

      const input: ToControllerInput = {
        session: mockSession,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      const result = SessionPresentation.toController(input);

      expect(Object.keys(result)).toEqual([
        'session_id',
        'access_token',
        'refresh_token',
      ]);
      expect(Object.keys(result).length).toBe(3);
    });
  });
});
