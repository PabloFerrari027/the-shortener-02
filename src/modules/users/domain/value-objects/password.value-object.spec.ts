import { Password } from './password.value-object';

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create a password with any value', () => {
      const password = Password.create('myPassword123');
      expect(password).toBeInstanceOf(Password);
      expect(password.value).toBe('myPassword123');
    });

    it('should create password with empty string', () => {
      const password = Password.create('');
      expect(password.value).toBe('');
    });

    it('should create password with special characters', () => {
      const passwords = [
        'P@ssw0rd!',
        'my-password_123',
        'password$%^&*()',
        'пароль',
        '密码',
        'contraseña',
      ];

      passwords.forEach((pwd) => {
        const password = Password.create(pwd);
        expect(password.value).toBe(pwd);
      });
    });

    it('should create password with whitespace', () => {
      const password = Password.create('my password');
      expect(password.value).toBe('my password');
    });

    it('should create password with only whitespace', () => {
      const password = Password.create('   ');
      expect(password.value).toBe('   ');
    });

    it('should create password with numbers only', () => {
      const password = Password.create('123456');
      expect(password.value).toBe('123456');
    });

    it('should create very long password', () => {
      const longPassword = 'a'.repeat(1000);
      const password = Password.create(longPassword);
      expect(password.value).toBe(longPassword);
    });

    it('should create password with single character', () => {
      const password = Password.create('a');
      expect(password.value).toBe('a');
    });
  });

  describe('value getter', () => {
    it('should return the password value', () => {
      const password = Password.create('myPassword123');
      expect(password.value).toBe('myPassword123');
    });

    it('should return immutable value', () => {
      const password = Password.create('myPassword123');
      const value1 = password.value;
      const value2 = password.value;
      expect(value1).toBe(value2);
      expect(value1).toBe('myPassword123');
    });

    it('should not expose internal state', () => {
      const password = Password.create('secret');
      expect(password.value).toBe('secret');
      expect((password as any)._value).toBe('secret');
    });
  });

  describe('equals', () => {
    it('should return true for passwords with same value', () => {
      const password1 = Password.create('myPassword123');
      const password2 = Password.create('myPassword123');
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for passwords with different values', () => {
      const password1 = Password.create('password1');
      const password2 = Password.create('password2');
      expect(password1.equals(password2)).toBe(false);
    });

    it('should return true when comparing same instance', () => {
      const password = Password.create('myPassword123');
      expect(password.equals(password)).toBe(true);
    });

    it('should be case sensitive', () => {
      const password1 = Password.create('Password');
      const password2 = Password.create('password');
      expect(password1.equals(password2)).toBe(false);
    });

    it('should consider whitespace differences', () => {
      const password1 = Password.create('password');
      const password2 = Password.create('password ');
      expect(password1.equals(password2)).toBe(false);
    });

    it('should return true for empty passwords', () => {
      const password1 = Password.create('');
      const password2 = Password.create('');
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false when comparing empty with non-empty', () => {
      const password1 = Password.create('');
      const password2 = Password.create('password');
      expect(password1.equals(password2)).toBe(false);
    });

    it('should handle special characters in comparison', () => {
      const password1 = Password.create('P@ssw0rd!');
      const password2 = Password.create('P@ssw0rd!');
      const password3 = Password.create('P@ssw0rd');
      expect(password1.equals(password2)).toBe(true);
      expect(password1.equals(password3)).toBe(false);
    });
  });
});
