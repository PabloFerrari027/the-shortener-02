import { CodeValidation } from './code-validation.entity';
import { InvalidCodeValidationError } from '../erros/invalid-code-validation.error';
import { CodeValidationCreatedEvent } from '../events/code-validation-created.event';
import { CodeValidationUsedEvent } from '../events/code-validation-used.event';
import { CodeValidationRemovedEvent } from '../events/code-validation-removed.event';

describe('CodeValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.spyOn(global.crypto, 'randomUUID').mockRestore();
  });

  describe('create', () => {
    it('should create a new CodeValidation with generated id and expiresAt', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

      const sessionId = 'session-123';
      const value = '123456';

      const codeValidation = CodeValidation.create({
        sessionId,
        value,
      });

      expect(codeValidation.id).toBe(mockUUID);
      expect(codeValidation.sessionId).toBe(sessionId);
      expect(codeValidation.value).toBe(value);
      expect(codeValidation.usedAt).toBeUndefined();
      expect(codeValidation.expiresAt).toBeInstanceOf(Date);
      expect(codeValidation.createdAt).toBeInstanceOf(Date);
      expect(codeValidation.updatedAt).toBeInstanceOf(Date);
    });

    it('should set expiresAt to 1 hour from now', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const afterCreation = new Date();
      const oneHourLater = new Date(afterCreation);
      oneHourLater.setHours(oneHourLater.getHours() + 1);

      const timeDiff =
        codeValidation.expiresAt.getTime() - afterCreation.getTime();
      const oneHour = 60 * 60 * 1000;

      expect(timeDiff).toBeGreaterThanOrEqual(oneHour - 1000);
      expect(timeDiff).toBeLessThanOrEqual(oneHour + 1000);
    });

    it('should create a CodeValidationCreatedEvent', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const events = codeValidation.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CodeValidationCreatedEvent);
    });

    it('should throw InvalidCodeValidationError for invalid code', () => {
      expect(() =>
        CodeValidation.create({
          sessionId: 'session-123',
          value: '12345',
        }),
      ).toThrow(InvalidCodeValidationError);
    });
  });

  describe('generate', () => {
    it('should generate a 6-digit code', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.123456);
      const code = CodeValidation.generate();
      expect(code).toBe('123456');
      expect(code).toHaveLength(6);
    });

    it('should pad code with zeros when needed', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.000123);
      const code = CodeValidation.generate();
      expect(code).toBe('000123');
    });

    it('should generate code with all zeros', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.0000001);
      const code = CodeValidation.generate();
      expect(code).toBe('000000');
    });

    it('should generate maximum code value', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.999999);
      const code = CodeValidation.generate();
      expect(code).toBe('999999');
    });
  });

  describe('isValid', () => {
    it('should return true for valid 6-digit code', () => {
      expect(CodeValidation.isValid('123456')).toBe(true);
      expect(CodeValidation.isValid('000000')).toBe(true);
      expect(CodeValidation.isValid('999999')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(CodeValidation.isValid('12345')).toBe(false);
      expect(CodeValidation.isValid('1234567')).toBe(false);
      expect(CodeValidation.isValid('12345a')).toBe(false);
      expect(CodeValidation.isValid('abc123')).toBe(false);
      expect(CodeValidation.isValid('')).toBe(false);
      expect(CodeValidation.isValid('12 456')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate a UUID', () => {
      const mockUUID = '456e7890-e89b-12d3-a456-426614174001';
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

      const id = CodeValidation.generateId();
      expect(id).toBe(mockUUID);
    });
  });

  describe('getters', () => {
    it('should return all properties correctly', () => {
      const props = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: new Date('2024-01-01T10:00:00Z').toJSON(),
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('CAMEL_CASE', props);

      expect(codeValidation.id).toBe(props.id);
      expect(codeValidation.sessionId).toBe(props.sessionId);
      expect(codeValidation.value).toBe(props.value);
      expect(codeValidation.usedAt?.toJSON()).toEqual(props.usedAt);
      expect(codeValidation.expiresAt?.toJSON()).toEqual(props.expiresAt);
      expect(codeValidation.createdAt.toJSON()).toEqual(props.createdAt);
      expect(codeValidation.updatedAt.toJSON()).toEqual(props.updatedAt);
    });
  });

  describe('usedAt setter', () => {
    it('should set usedAt and update updatedAt', async () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const initialUpdatedAt = codeValidation.updatedAt.getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const usedDate = new Date();
      codeValidation.usedAt = usedDate;

      expect(codeValidation.usedAt).toEqual(usedDate);
      expect(codeValidation.updatedAt.getTime()).toBeGreaterThanOrEqual(
        initialUpdatedAt,
      );
    });

    it('should create a CodeValidationUsedEvent', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      codeValidation.pullEvents();

      const usedDate = new Date('2024-01-01T13:00:00Z');
      codeValidation.usedAt = usedDate;

      const events = codeValidation.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CodeValidationUsedEvent);
    });
  });

  describe('isUsed', () => {
    it('should return false when usedAt is undefined', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      expect(codeValidation.isUsed()).toBe(false);
    });

    it('should return true when usedAt is set', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      codeValidation.usedAt = new Date();

      expect(codeValidation.isUsed()).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return false when not expired', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      const json = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: futureDate.toJSON(),
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('CAMEL_CASE', json);

      expect(codeValidation.isExpired()).toBe(false);
    });

    it('should return true when expired', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);

      const json = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: pastDate.toJSON(),
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('CAMEL_CASE', json);

      expect(codeValidation.isExpired()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should convert to snake_case format', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const json = codeValidation.toJSON('SNAKE_CASE');

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('session_id', 'session-123');
      expect(json).toHaveProperty('value', '123456');
      expect(json).toHaveProperty('used_at');
      expect(json).toHaveProperty('expires_at');
      expect(json).toHaveProperty('created_at');
      expect(json).toHaveProperty('updated_at');
    });

    it('should convert to camelCase format', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const json = codeValidation.toJSON('CAMEL_CASE');

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('sessionId', 'session-123');
      expect(json).toHaveProperty('value', '123456');
      expect(json).toHaveProperty('usedAt');
      expect(json).toHaveProperty('expiresAt');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    it('should handle usedAt when set', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const usedDate = new Date('2024-01-01T13:00:00Z');
      codeValidation.usedAt = usedDate;

      const jsonSnake = codeValidation.toJSON('SNAKE_CASE');
      const jsonCamel = codeValidation.toJSON('CAMEL_CASE');

      expect(jsonSnake.used_at).toBe(usedDate.toJSON());
      expect(jsonCamel.usedAt).toBe(usedDate.toJSON());
    });
  });

  describe('fromJSON', () => {
    it('should create from snake_case format', () => {
      const json = {
        id: 'id-123',
        session_id: 'session-123',
        value: '123456',
        used_at: undefined,
        expires_at: new Date('2024-01-01T13:00:00Z').toJSON(),
        created_at: new Date('2024-01-01T12:00:00Z').toJSON(),
        updated_at: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('SNAKE_CASE', json);

      expect(codeValidation.id).toBe('id-123');
      expect(codeValidation.sessionId).toBe('session-123');
      expect(codeValidation.value).toBe('123456');
      expect(codeValidation.usedAt).toBeUndefined();
    });

    it('should create from camelCase format', () => {
      const json = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('CAMEL_CASE', json);

      expect(codeValidation.id).toBe('id-123');
      expect(codeValidation.sessionId).toBe('session-123');
      expect(codeValidation.value).toBe('123456');
      expect(codeValidation.usedAt).toBeUndefined();
    });

    it('should handle usedAt when present in snake_case', () => {
      const usedDate = new Date('2024-01-01T10:00:00Z');
      const json = {
        id: 'id-123',
        session_id: 'session-123',
        value: '123456',
        used_at: usedDate.toJSON(),
        expires_at: new Date('2024-01-01T13:00:00Z').toJSON(),
        created_at: new Date('2024-01-01T12:00:00Z').toJSON(),
        updated_at: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('SNAKE_CASE', json);

      expect(codeValidation.usedAt).toEqual(usedDate);
    });

    it('should handle usedAt when present in camelCase', () => {
      const usedDate = new Date('2024-01-01T10:00:00Z');
      const json = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: usedDate.toJSON(),
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation = CodeValidation.fromJSON('CAMEL_CASE', json);

      expect(codeValidation.usedAt).toEqual(usedDate);
    });
  });

  describe('equals', () => {
    it('should return true for equal CodeValidations', () => {
      const json = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation1 = CodeValidation.fromJSON('CAMEL_CASE', json);
      const codeValidation2 = CodeValidation.fromJSON('CAMEL_CASE', json);

      expect(codeValidation1.equals(codeValidation2)).toBe(true);
    });

    it('should return false for different CodeValidations', () => {
      const json1 = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const json2 = {
        ...json1,
        value: '654321',
      };

      const codeValidation1 = CodeValidation.fromJSON('CAMEL_CASE', json1);
      const codeValidation2 = CodeValidation.fromJSON('CAMEL_CASE', json2);

      expect(codeValidation1.equals(codeValidation2)).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return true for equal CodeValidations', () => {
      const json = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const codeValidation1 = CodeValidation.fromJSON('CAMEL_CASE', json);
      const codeValidation2 = CodeValidation.fromJSON('CAMEL_CASE', json);

      expect(CodeValidation.compare(codeValidation1, codeValidation2)).toBe(
        true,
      );
    });

    it('should return false for different CodeValidations', () => {
      const json1 = {
        id: 'id-123',
        sessionId: 'session-123',
        value: '123456',
        usedAt: undefined,
        expiresAt: new Date('2024-01-01T13:00:00Z').toJSON(),
        createdAt: new Date('2024-01-01T12:00:00Z').toJSON(),
        updatedAt: new Date('2024-01-01T12:00:00Z').toJSON(),
      };

      const json2 = {
        ...json1,
        id: 'id-456',
      };

      const codeValidation1 = CodeValidation.fromJSON('CAMEL_CASE', json1);
      const codeValidation2 = CodeValidation.fromJSON('CAMEL_CASE', json2);

      expect(CodeValidation.compare(codeValidation1, codeValidation2)).toBe(
        false,
      );
    });
  });

  describe('remove', () => {
    it('should create a CodeValidationRemovedEvent', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      codeValidation.pullEvents();

      codeValidation.remove();

      const events = codeValidation.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CodeValidationRemovedEvent);
    });

    it('should include entity data in removed event', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      codeValidation.pullEvents();
      codeValidation.remove();

      const events = codeValidation.pullEvents();
      const event = events[0] as CodeValidationRemovedEvent;

      expect(event.props).toHaveProperty('id', codeValidation.id);
      expect(event.props).toHaveProperty('session_id', 'session-123');
      expect(event.props).toHaveProperty('value', '123456');
    });
  });

  describe('pullEvents', () => {
    it('should return all events and clear the events array', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      const events1 = codeValidation.pullEvents();
      expect(events1).toHaveLength(1);

      const events2 = codeValidation.pullEvents();
      expect(events2).toHaveLength(0);
    });

    it('should handle multiple events', () => {
      const codeValidation = CodeValidation.create({
        sessionId: 'session-123',
        value: '123456',
      });

      codeValidation.usedAt = new Date();
      codeValidation.remove();

      const events = codeValidation.pullEvents();
      expect(events).toHaveLength(3);
    });
  });
});
