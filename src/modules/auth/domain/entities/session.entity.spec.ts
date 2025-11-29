import { Session, JSONFormats, SessionJSON } from './session.entity';
import { SessionCreatedEvent } from '../events/session-created.event';
import { SessionValidatedEvent } from '../events/session-validated.event';
import { SessionCloseEvent } from '../events/session-close.event';
import { SessionRemovedEvent } from '../events/session-removed.event';

describe('Session Entity', () => {
  describe('create', () => {
    it('should create a new session with generated id', () => {
      const userId = 'user-123';
      const session = Session.create({ userId });

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.validatedAt).toBeUndefined();
      expect(session.closedAt).toBeUndefined();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate SessionCreatedEvent on creation', () => {
      const userId = 'user-123';
      const session = Session.create({ userId });
      const events = session.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionCreatedEvent);
      expect(events[0].props).toMatchObject({
        id: session.id,
        occurredOn: expect.any(Date),
      });
    });

    it('should create session with optional validatedAt', () => {
      const userId = 'user-123';
      const validatedAt = new Date('2024-01-01');
      const session = Session.create({ userId, validatedAt });

      expect(session.validatedAt).toEqual(validatedAt);
    });

    it('should create session with optional closedAt', () => {
      const userId = 'user-123';
      const closedAt = new Date('2024-01-01');
      const session = Session.create({ userId, closedAt });

      expect(session.closedAt).toEqual(closedAt);
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = Session.generateId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique ids', () => {
      const id1 = Session.generateId();
      const id2 = Session.generateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('validate', () => {
    it('should set validatedAt timestamp', () => {
      const session = Session.create({ userId: 'user-123' });
      const beforeValidate = new Date();

      session.validate();

      expect(session.validatedAt).toBeInstanceOf(Date);
      expect(session.validatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeValidate.getTime(),
      );
    });

    it('should update updatedAt timestamp', () => {
      const session = Session.create({ userId: 'user-123' });
      const initialUpdatedAt = session.updatedAt;

      setTimeout(() => {
        session.validate();
        expect(session.updatedAt.getTime()).toBeGreaterThan(
          initialUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should generate SessionValidatedEvent', () => {
      const session = Session.create({ userId: 'user-123' });
      session.pullEvents();

      session.validate();
      const events = session.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionValidatedEvent);
      expect(events[0].props).toMatchObject({
        id: session.id,
        occurredOn: expect.any(Date),
      });
    });
  });

  describe('close', () => {
    it('should set closedAt timestamp', () => {
      const session = Session.create({ userId: 'user-123' });
      const beforeClose = new Date();

      session.close();

      expect(session.closedAt).toBeInstanceOf(Date);
      expect(session.closedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeClose.getTime(),
      );
    });

    it('should update updatedAt timestamp', () => {
      const session = Session.create({ userId: 'user-123' });
      const initialUpdatedAt = session.updatedAt;

      setTimeout(() => {
        session.close();
        expect(session.updatedAt.getTime()).toBeGreaterThan(
          initialUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should generate SessionCloseEvent', () => {
      const session = Session.create({ userId: 'user-123' });
      session.pullEvents();

      session.close();
      const events = session.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionCloseEvent);
      expect(events[0].props).toMatchObject({
        id: session.id,
        occurredOn: expect.any(Date),
      });
    });
  });

  describe('remove', () => {
    it('should generate SessionRemovedEvent with session data', () => {
      const session = Session.create({ userId: 'user-123' });
      session.pullEvents();

      session.remove();
      const events = session.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionRemovedEvent);
      expect(events[0].props).toMatchObject({
        id: session.id,
        user_id: session.userId,
        created_at: session.createdAt.toJSON(),
        updated_at: session.updatedAt.toJSON(),
        occurredOn: expect.any(Date),
      });
    });
  });

  describe('toJSON', () => {
    it('should convert to snake_case format', () => {
      const session = Session.create({ userId: 'user-123' });
      const json = session.toJSON(JSONFormats.SNAKE_CASE);

      expect(json).toMatchObject({
        id: session.id,
        user_id: 'user-123',
        created_at: session.createdAt.toJSON(),
        updated_at: session.updatedAt.toJSON(),
      });
      expect(json.validated_at).toBeUndefined();
      expect(json.closed_at).toBeUndefined();
    });

    it('should convert to camelCase format', () => {
      const session = Session.create({ userId: 'user-123' });
      const json = session.toJSON(JSONFormats.CAMEL_CASE);

      expect(json).toMatchObject({
        id: session.id,
        userId: 'user-123',
        createdAt: session.createdAt.toJSON(),
        updatedAt: session.updatedAt.toJSON(),
      });
      expect(json.validatedAt).toBeUndefined();
      expect(json.closedAt).toBeUndefined();
    });

    it('should include validatedAt in snake_case when present', () => {
      const session = Session.create({ userId: 'user-123' });
      session.validate();
      const json = session.toJSON(JSONFormats.SNAKE_CASE);

      expect(json.validated_at).toBe(session.validatedAt!.toJSON());
    });

    it('should include validatedAt in camelCase when present', () => {
      const session = Session.create({ userId: 'user-123' });
      session.validate();
      const json = session.toJSON(JSONFormats.CAMEL_CASE);

      expect(json.validatedAt).toBe(session.validatedAt!.toJSON());
    });

    it('should include closedAt in snake_case when present', () => {
      const session = Session.create({ userId: 'user-123' });
      session.close();
      const json = session.toJSON(JSONFormats.SNAKE_CASE);

      expect(json.closed_at).toBe(session.closedAt!.toJSON());
    });

    it('should include closedAt in camelCase when present', () => {
      const session = Session.create({ userId: 'user-123' });
      session.close();
      const json = session.toJSON(JSONFormats.CAMEL_CASE);

      expect(json.closedAt).toBe(session.closedAt!.toJSON());
    });
  });

  describe('fromJSON', () => {
    it('should create session from snake_case JSON', () => {
      const json: SessionJSON<typeof JSONFormats.SNAKE_CASE> = {
        id: 'session-123',
        user_id: 'user-456',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      const session = Session.fromJSON(JSONFormats.SNAKE_CASE, json);

      expect(session.id).toBe('session-123');
      expect(session.userId).toBe('user-456');
      expect(session.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(session.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
      expect(session.validatedAt).toBeUndefined();
      expect(session.closedAt).toBeUndefined();
    });

    it('should create session from camelCase JSON', () => {
      const json: SessionJSON<typeof JSONFormats.CAMEL_CASE> = {
        id: 'session-123',
        userId: 'user-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const session = Session.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(session.id).toBe('session-123');
      expect(session.userId).toBe('user-456');
      expect(session.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(session.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
      expect(session.validatedAt).toBeUndefined();
      expect(session.closedAt).toBeUndefined();
    });

    it('should handle validatedAt from snake_case JSON', () => {
      const json: SessionJSON<typeof JSONFormats.SNAKE_CASE> = {
        id: 'session-123',
        user_id: 'user-456',
        validated_at: '2024-01-03T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      const session = Session.fromJSON(JSONFormats.SNAKE_CASE, json);

      expect(session.validatedAt).toEqual(new Date('2024-01-03T00:00:00.000Z'));
    });

    it('should handle validatedAt from camelCase JSON', () => {
      const json: SessionJSON<typeof JSONFormats.CAMEL_CASE> = {
        id: 'session-123',
        userId: 'user-456',
        validatedAt: '2024-01-03T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const session = Session.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(session.validatedAt).toEqual(new Date('2024-01-03T00:00:00.000Z'));
    });

    it('should handle closedAt from snake_case JSON', () => {
      const json: SessionJSON<typeof JSONFormats.SNAKE_CASE> = {
        id: 'session-123',
        user_id: 'user-456',
        closed_at: '2024-01-04T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      const session = Session.fromJSON(JSONFormats.SNAKE_CASE, json);

      expect(session.closedAt).toEqual(new Date('2024-01-04T00:00:00.000Z'));
    });

    it('should handle closedAt from camelCase JSON', () => {
      const json: SessionJSON<typeof JSONFormats.CAMEL_CASE> = {
        id: 'session-123',
        userId: 'user-456',
        closedAt: '2024-01-04T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const session = Session.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(session.closedAt).toEqual(new Date('2024-01-04T00:00:00.000Z'));
    });
  });

  describe('equals', () => {
    it('should return true for sessions with same data', () => {
      const json: SessionJSON<typeof JSONFormats.CAMEL_CASE> = {
        id: 'session-123',
        userId: 'user-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const session1 = Session.fromJSON(JSONFormats.CAMEL_CASE, json);
      const session2 = Session.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(session1.equals(session2)).toBe(true);
    });

    it('should return false for sessions with different data', () => {
      const session1 = Session.create({ userId: 'user-123' });
      const session2 = Session.create({ userId: 'user-456' });

      expect(session1.equals(session2)).toBe(false);
    });

    it('should return false when validatedAt differs', () => {
      const json: SessionJSON<typeof JSONFormats.CAMEL_CASE> = {
        id: 'session-123',
        userId: 'user-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const session1 = Session.fromJSON(JSONFormats.CAMEL_CASE, json);
      const session2 = Session.fromJSON(JSONFormats.CAMEL_CASE, json);
      session2.validate();

      expect(session1.equals(session2)).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return true for equal sessions', () => {
      const json: SessionJSON<typeof JSONFormats.CAMEL_CASE> = {
        id: 'session-123',
        userId: 'user-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const session1 = Session.fromJSON(JSONFormats.CAMEL_CASE, json);
      const session2 = Session.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(Session.compare(session1, session2)).toBe(true);
    });

    it('should return false for different sessions', () => {
      const session1 = Session.create({ userId: 'user-123' });
      const session2 = Session.create({ userId: 'user-456' });

      expect(Session.compare(session1, session2)).toBe(false);
    });
  });

  describe('pullEvents', () => {
    it('should return all accumulated events', () => {
      const session = Session.create({ userId: 'user-123' });
      session.validate();
      session.close();

      const events = session.pullEvents();

      expect(events).toHaveLength(3);
      expect(events[0]).toBeInstanceOf(SessionCreatedEvent);
      expect(events[1]).toBeInstanceOf(SessionValidatedEvent);
      expect(events[2]).toBeInstanceOf(SessionCloseEvent);
    });

    it('should clear events after pulling', () => {
      const session = Session.create({ userId: 'user-123' });
      session.validate();

      session.pullEvents();
      const secondPull = session.pullEvents();

      expect(secondPull).toHaveLength(0);
    });

    it('should allow accumulating new events after pulling', () => {
      const session = Session.create({ userId: 'user-123' });
      session.pullEvents();

      session.validate();
      session.close();
      const events = session.pullEvents();

      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(SessionValidatedEvent);
      expect(events[1]).toBeInstanceOf(SessionCloseEvent);
    });
  });

  describe('getters', () => {
    it('should return correct id', () => {
      const session = Session.create({ userId: 'user-123' });
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
    });

    it('should return correct userId', () => {
      const session = Session.create({ userId: 'user-123' });
      expect(session.userId).toBe('user-123');
    });

    it('should return correct createdAt', () => {
      const session = Session.create({ userId: 'user-123' });
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should return correct updatedAt', () => {
      const session = Session.create({ userId: 'user-123' });
      expect(session.updatedAt).toBeInstanceOf(Date);
    });

    it('should return undefined validatedAt when not validated', () => {
      const session = Session.create({ userId: 'user-123' });
      expect(session.validatedAt).toBeUndefined();
    });

    it('should return undefined closedAt when not closed', () => {
      const session = Session.create({ userId: 'user-123' });
      expect(session.closedAt).toBeUndefined();
    });
  });
});
