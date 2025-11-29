import { Email } from './email.value-object';
import { InvalidEmailError } from '../errors/invalid-email.error';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email).toBeInstanceOf(Email);
      expect(email.value).toBe('test@example.com');
    });

    it('should create email with different valid formats', () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'user_name@sub.domain.com',
        '123@domain.com',
      ];

      validEmails.forEach((validEmail) => {
        const email = Email.create(validEmail);
        expect(email.value).toBe(validEmail);
      });
    });

    it('should throw InvalidEmailError when email is empty', () => {
      expect(() => Email.create('')).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError when email is invalid', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@domain.com',
        'invalid@domain',
        'invalid domain@test.com',
        'invalid@domain..com',
      ];

      invalidEmails.forEach((invalidEmail) => {
        expect(() => Email.create(invalidEmail)).toThrow(InvalidEmailError);
      });
    });
  });

  describe('isValid', () => {
    it('should return true for valid emails', () => {
      expect(Email.isValid('test@example.com')).toBe(true);
      expect(Email.isValid('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(Email.isValid('')).toBe(false);
    });

    it('should return false for invalid emails', () => {
      expect(Email.isValid('invalid')).toBe(false);
      expect(Email.isValid('invalid@')).toBe(false);
      expect(Email.isValid('@domain.com')).toBe(false);
      expect(Email.isValid('invalid@domain')).toBe(false);
    });
  });

  describe('value getter', () => {
    it('should return the email value', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should return immutable value', () => {
      const email = Email.create('test@example.com');
      const value1 = email.value;
      const value2 = email.value;
      expect(value1).toBe(value2);
    });
  });

  describe('equals', () => {
    it('should return true for emails with same value', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for emails with different values', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return true when comparing same instance', () => {
      const email = Email.create('test@example.com');
      expect(email.equals(email)).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true for emails with same value', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(Email.compare(email1, email2)).toBe(true);
    });

    it('should return false for emails with different values', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(Email.compare(email1, email2)).toBe(false);
    });

    it('should return true when comparing same instance', () => {
      const email = Email.create('test@example.com');
      expect(Email.compare(email, email)).toBe(true);
    });
  });
});
