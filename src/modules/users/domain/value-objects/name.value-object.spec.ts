import { Name } from './name.value-object';
import { InvalidNameError } from '../errors/invalid-name.error';

describe('Name Value Object', () => {
  describe('create', () => {
    it('should create a valid name', () => {
      const name = Name.create('John Doe');
      expect(name).toBeInstanceOf(Name);
      expect(name.value).toBe('John Doe');
    });

    it('should create name with different valid formats', () => {
      const validNames = [
        'John',
        'John Doe',
        'María García',
        'Jean-Pierre',
        "O'Brien",
        'John Doe Jr.',
        '李明',
        'محمد',
        'João Silva',
      ];

      validNames.forEach((validName) => {
        const name = Name.create(validName);
        expect(name.value).toBe(validName);
      });
    });

    it('should throw InvalidNameError when name is empty', () => {
      expect(() => Name.create('')).toThrow(InvalidNameError);
    });

    it('should create name with whitespace only (class-validator isEmpty behavior)', () => {
      const whitespaceNames = ['   ', '\t', '\n', '  \t  '];

      whitespaceNames.forEach((whitespaceName) => {
        const name = Name.create(whitespaceName);
        expect(name.value).toBe(whitespaceName);
      });
    });

    it('should create name with numbers', () => {
      const name = Name.create('John Doe 123');
      expect(name.value).toBe('John Doe 123');
    });

    it('should create name with special characters', () => {
      const name = Name.create('John-Doe & Co.');
      expect(name.value).toBe('John-Doe & Co.');
    });
  });

  describe('isValid', () => {
    it('should return true for valid names', () => {
      expect(Name.isValid('John Doe')).toBe(true);
      expect(Name.isValid('María')).toBe(true);
      expect(Name.isValid('John-Pierre')).toBe(true);
      expect(Name.isValid('123')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(Name.isValid('')).toBe(false);
    });

    it('should return true for whitespace only strings (class-validator isEmpty behavior)', () => {
      expect(Name.isValid('   ')).toBe(true);
      expect(Name.isValid('\t')).toBe(true);
      expect(Name.isValid('\n')).toBe(true);
    });
  });

  describe('value getter', () => {
    it('should return the name value', () => {
      const name = Name.create('John Doe');
      expect(name.value).toBe('John Doe');
    });

    it('should return immutable value', () => {
      const name = Name.create('John Doe');
      const value1 = name.value;
      const value2 = name.value;
      expect(value1).toBe(value2);
    });
  });

  describe('equals', () => {
    it('should return true for names with same value', () => {
      const name1 = Name.create('John Doe');
      const name2 = Name.create('John Doe');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for names with different values', () => {
      const name1 = Name.create('John Doe');
      const name2 = Name.create('Jane Doe');
      expect(name1.equals(name2)).toBe(false);
    });

    it('should return true when comparing same instance', () => {
      const name = Name.create('John Doe');
      expect(name.equals(name)).toBe(true);
    });

    it('should return true when comparing with equal string', () => {
      const name = Name.create('John Doe');
      expect(name.equals('John Doe')).toBe(true);
    });

    it('should return false when comparing with different string', () => {
      const name = Name.create('John Doe');
      expect(name.equals('Jane Doe')).toBe(false);
    });

    it('should handle string comparison with special characters', () => {
      const name = Name.create('María García');
      expect(name.equals('María García')).toBe(true);
      expect(name.equals('Maria Garcia')).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return true for names with same value', () => {
      const name1 = Name.create('John Doe');
      const name2 = Name.create('John Doe');
      expect(Name.compare(name1, name2)).toBe(true);
    });

    it('should return false for names with different values', () => {
      const name1 = Name.create('John Doe');
      const name2 = Name.create('Jane Doe');
      expect(Name.compare(name1, name2)).toBe(false);
    });

    it('should return true when comparing same instance', () => {
      const name = Name.create('John Doe');
      expect(Name.compare(name, name)).toBe(true);
    });
  });
});
