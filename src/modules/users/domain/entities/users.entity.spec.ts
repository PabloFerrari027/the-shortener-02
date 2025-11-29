import { User, UserRole, JSONFormats } from './user.entity';
import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserRemovedEvent } from '../events/user-removed.event';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { InvalidRoleError } from '../errors/invalid-role.error';
import { RootUserRoleChangeNotAllowedError } from '../errors/root-user-role-chager-not-allowed.error';
import { Env } from '@/shared/env';

describe('User Entity', () => {
  const mockUserProps = {
    name: Name.create('John Doe'),
    email: Email.create('john@example.com'),
    password: Password.create('password123'),
    role: UserRole.ADMIN,
  };

  describe('create', () => {
    it('should create a new user with generated id and timestamps', () => {
      const user = User.create(mockUserProps);

      expect(user.id).toBeDefined();
      expect(user.name).toEqual(mockUserProps.name);
      expect(user.email).toEqual(mockUserProps.email);
      expect(user.password).toEqual(mockUserProps.password);
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create UserCreatedEvent on user creation', () => {
      const user = User.create(mockUserProps);
      const events = user.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      expect(events[0].props).toHaveProperty('id', user.id);
      expect(events[0].props).toHaveProperty('occurredOn');
    });
  });

  describe('getters', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(mockUserProps);
    });

    it('should return id', () => {
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
    });

    it('should return name', () => {
      expect(user.name).toEqual(mockUserProps.name);
    });

    it('should return email', () => {
      expect(user.email).toEqual(mockUserProps.email);
    });

    it('should return password', () => {
      expect(user.password).toEqual(mockUserProps.password);
    });

    it('should return role', () => {
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should return createdAt', () => {
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should return updatedAt', () => {
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('role setter', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(mockUserProps);
      user.pullEvents(); // Limpa eventos de criação
    });

    it('should change user role and create UserRoleChangedEvent', () => {
      user.role = UserRole.CLINET;

      expect(user.role).toBe(UserRole.CLINET);

      const events = user.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRoleChangedEvent);
      expect(events[0].props).toHaveProperty('id', user.id);
      expect(events[0].props).toHaveProperty('from', UserRole.ADMIN);
      expect(events[0].props).toHaveProperty('to', UserRole.CLINET);
      expect(events[0].props).toHaveProperty('occurredOn');
    });

    it('should not create event when setting the same role', () => {
      user.role = UserRole.ADMIN;

      const events = user.pullEvents();
      expect(events).toHaveLength(0);
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should throw InvalidRoleError when setting invalid role', () => {
      expect(() => {
        user.role = 'INVALID_ROLE' as UserRole;
      }).toThrow(InvalidRoleError);
    });

    it('should throw RootUserRoleChangeNotAllowedError when trying to change root user role', () => {
      const rootUserEmail = 'root@example.com';
      const originalRootEmail = Env.ROOT_USER_EMAIL;

      // Mock do Env.ROOT_USER_EMAIL
      Object.defineProperty(Env, 'ROOT_USER_EMAIL', {
        value: rootUserEmail,
        writable: true,
        configurable: true,
      });

      const rootUser = User.create({
        ...mockUserProps,
        email: Email.create(rootUserEmail),
      });
      rootUser.pullEvents(); // Limpa eventos de criação

      expect(() => {
        rootUser.role = UserRole.CLINET;
      }).toThrow(RootUserRoleChangeNotAllowedError);

      // Restaura o valor original
      Object.defineProperty(Env, 'ROOT_USER_EMAIL', {
        value: originalRootEmail,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('isValidRole', () => {
    it('should return true for valid ADMIN role', () => {
      expect(User.isValidRole(UserRole.ADMIN)).toBe(true);
      expect(User.isValidRole('ADMIN')).toBe(true);
    });

    it('should return true for valid CLINET role', () => {
      expect(User.isValidRole(UserRole.CLINET)).toBe(true);
      expect(User.isValidRole('CLINET')).toBe(true);
    });

    it('should return false for invalid role', () => {
      expect(User.isValidRole('INVALID_ROLE')).toBe(false);
      expect(User.isValidRole('user')).toBe(false);
      expect(User.isValidRole('manager')).toBe(false);
      expect(User.isValidRole('')).toBe(false);
    });
  });

  describe('toJSON', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(mockUserProps);
    });

    it('should convert to snake_case JSON format', () => {
      const json = user.toJSON(JSONFormats.SNAKE_CASE);

      expect(json).toHaveProperty('id', user.id);
      expect(json).toHaveProperty('name', mockUserProps.name.value);
      expect(json).toHaveProperty('email', mockUserProps.email.value);
      expect(json).toHaveProperty('password', mockUserProps.password.value);
      expect(json).toHaveProperty('role', UserRole.ADMIN);
      expect(json).toHaveProperty('created_at');
      expect(json).toHaveProperty('updated_at');
      expect(json).not.toHaveProperty('createdAt');
      expect(json).not.toHaveProperty('updatedAt');
    });

    it('should convert to camelCase JSON format', () => {
      const json = user.toJSON(JSONFormats.CAMEL_CASE);

      expect(json).toHaveProperty('id', user.id);
      expect(json).toHaveProperty('name', mockUserProps.name.value);
      expect(json).toHaveProperty('email', mockUserProps.email.value);
      expect(json).toHaveProperty('password', mockUserProps.password.value);
      expect(json).toHaveProperty('role', UserRole.ADMIN);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
      expect(json).not.toHaveProperty('created_at');
      expect(json).not.toHaveProperty('updated_at');
    });
  });

  describe('fromJSON', () => {
    it('should create user from snake_case JSON', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password456',
        role: UserRole.CLINET,
        created_at: new Date().toJSON(),
        updated_at: new Date().toJSON(),
      };

      const user = User.fromJSON(JSONFormats.SNAKE_CASE, json);

      expect(user.id).toBe(json.id);
      expect(user.name.value).toBe(json.name);
      expect(user.email.value).toBe(json.email);
      expect(user.password.value).toBe(json.password);
      expect(user.role).toBe(UserRole.CLINET);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create user from camelCase JSON', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password456',
        role: UserRole.ADMIN,
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON(),
      };

      const user = User.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(user.id).toBe(json.id);
      expect(user.name.value).toBe(json.name);
      expect(user.email.value).toBe(json.email);
      expect(user.password.value).toBe(json.password);
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('equals', () => {
    it('should return true for equal users', () => {
      const user1 = User.create(mockUserProps);
      const json = user1.toJSON(JSONFormats.CAMEL_CASE);
      const user2 = User.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for different users', () => {
      const user1 = User.create(mockUserProps);
      const user2 = User.create({
        ...mockUserProps,
        email: Email.create('different@example.com'),
      });

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return true for equal users', () => {
      const user1 = User.create(mockUserProps);
      const json = user1.toJSON(JSONFormats.CAMEL_CASE);
      const user2 = User.fromJSON(JSONFormats.CAMEL_CASE, json);

      expect(User.compare(user1, user2)).toBe(true);
    });

    it('should return false for different users', () => {
      const user1 = User.create(mockUserProps);
      const user2 = User.create({
        ...mockUserProps,
        name: Name.create('Different Name'),
      });

      expect(User.compare(user1, user2)).toBe(false);
    });
  });

  describe('remove', () => {
    it('should add UserRemovedEvent to events', () => {
      const user = User.create(mockUserProps);
      user.pullEvents();

      user.remove();
      const events = user.pullEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRemovedEvent);
      expect(events[0].props).toHaveProperty('id', user.id);
      expect(events[0].props).toHaveProperty('occurredOn');
    });
  });

  describe('pullEvents', () => {
    it('should return events and clear the events array', () => {
      const user = User.create(mockUserProps);

      const events1 = user.pullEvents();
      expect(events1).toHaveLength(1);

      const events2 = user.pullEvents();
      expect(events2).toHaveLength(0);
    });

    it('should handle multiple events', () => {
      const user = User.create(mockUserProps);
      user.remove();

      const events = user.pullEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      expect(events[1]).toBeInstanceOf(UserRemovedEvent);

      const eventsAfter = user.pullEvents();
      expect(eventsAfter).toHaveLength(0);
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = User.generateId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = User.generateId();
      const id2 = User.generateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('UserRole enum', () => {
    it('should have ADMIN role', () => {
      expect(UserRole.ADMIN).toBe('ADMIN');
    });

    it('should have CLINET role', () => {
      expect(UserRole.CLINET).toBe('CLINET');
    });
  });
});
