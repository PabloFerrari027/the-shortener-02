/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ShortUrl } from './short-url.entity';
import { InvalidShortUrlFieldError } from '../errors/invalid-short-url-field.error';
import { InvalidRangeValueError } from '../errors/invalid-range-value.error';
import { JSONFormats } from '../../../../shared/types/json-format.type';

describe('ShortUrl', () => {
  describe('create', () => {
    it('should create a valid ShortUrl instance', () => {
      const shortUrl = ShortUrl.create({
        hash: 'abc123',
        url: 'https://example.com',
      });

      expect(shortUrl).toBeInstanceOf(ShortUrl);
      expect(shortUrl.id).toBeDefined();
      expect(shortUrl.hash).toBe('abc123');
      expect(shortUrl.url).toBe('https://example.com');
      expect(shortUrl.clickCount).toBe(0);
      expect(shortUrl.createdAt).toBeInstanceOf(Date);
      expect(shortUrl.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a valid ShortUrl instance with userId', () => {
      const shortUrl = ShortUrl.create({
        hash: 'abc123',
        url: 'https://example.com',
        userId: 'user-123',
      });

      expect(shortUrl).toBeInstanceOf(ShortUrl);
      expect(shortUrl.userId).toBe('user-123');
    });

    it('should create ShortUrl with events', () => {
      const shortUrl = ShortUrl.create({
        hash: 'abc123',
        url: 'https://example.com',
      });

      const events = shortUrl.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('props.occurredOn');
    });

    it('should throw InvalidShortUrlFieldError when url is invalid', () => {
      expect(() => {
        ShortUrl.create({
          hash: 'abc123',
          url: '',
        });
      }).toThrow(InvalidShortUrlFieldError);

      expect(() => {
        ShortUrl.create({
          hash: 'abc123',
          url: '   ',
        });
      }).toThrow(InvalidShortUrlFieldError);
    });

    it('should throw InvalidShortUrlFieldError when hash is invalid', () => {
      expect(() => {
        ShortUrl.create({
          hash: '',
          url: 'https://example.com',
        });
      }).toThrow(InvalidShortUrlFieldError);

      expect(() => {
        ShortUrl.create({
          hash: '!@#',
          url: 'https://example.com',
        });
      }).toThrow(InvalidShortUrlFieldError);
    });
  });

  describe('getters', () => {
    let shortUrl: ShortUrl;

    beforeEach(() => {
      shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });
    });

    it('should return correct id', () => {
      expect(shortUrl.id).toBeDefined();
      expect(typeof shortUrl.id).toBe('string');
    });

    it('should return correct hash', () => {
      expect(shortUrl.hash).toBe('test123');
    });

    it('should return correct url', () => {
      expect(shortUrl.url).toBe('https://test.com');
    });

    it('should return correct clickCount', () => {
      expect(shortUrl.clickCount).toBe(0);
    });

    it('should return correct userId', () => {
      expect(shortUrl.userId).toBeUndefined();
    });

    it('should return correct userId when set', () => {
      const shortUrlWithUser = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
        userId: 'user-456',
      });
      expect(shortUrlWithUser.userId).toBe('user-456');
    });

    it('should return correct createdAt', () => {
      expect(shortUrl.createdAt).toBeInstanceOf(Date);
    });

    it('should return correct updatedAt', () => {
      expect(shortUrl.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('url setter', () => {
    let shortUrl: ShortUrl;

    beforeEach(() => {
      shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });
      // Clear creation event
      shortUrl.pullEvents();
    });

    it('should update url and updatedAt', () => {
      const oldUpdatedAt = shortUrl.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      shortUrl.url = 'https://newurl.com';

      expect(shortUrl.url).toBe('https://newurl.com');
      expect(shortUrl.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('should create ShortUrlChangedEvent when url is updated', () => {
      shortUrl.url = 'https://newurl.com';

      const events = shortUrl.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('props.occurredOn');
    });

    it('should throw InvalidShortUrlFieldError when setting invalid url', () => {
      expect(() => {
        shortUrl.url = '';
      }).toThrow(InvalidShortUrlFieldError);

      expect(() => {
        shortUrl.url = '   ';
      }).toThrow(InvalidShortUrlFieldError);
    });
  });

  describe('incrementClickCount', () => {
    it('should increment click count and update updatedAt', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      const oldUpdatedAt = shortUrl.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      shortUrl.incrementClickCount();

      expect(shortUrl.clickCount).toBe(1);
      expect(shortUrl.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );

      shortUrl.incrementClickCount();
      expect(shortUrl.clickCount).toBe(2);

      jest.useRealTimers();
    });

    it('should create ShortUrlClickedEvent when incremented', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      // Clear creation event
      shortUrl.pullEvents();

      shortUrl.incrementClickCount();

      const events = shortUrl.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('props.occurredOn');
    });
  });

  describe('remove', () => {
    it('should create ShortUrlRemovedEvent when removed', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      // Clear creation event
      shortUrl.pullEvents();

      shortUrl.remove();

      const events = shortUrl.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('props.occurredOn');
    });
  });

  describe('pullEvents', () => {
    it('should return events and clear the events array', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      const events1 = shortUrl.pullEvents();
      expect(events1).toHaveLength(1);

      const events2 = shortUrl.pullEvents();
      expect(events2).toHaveLength(0);
    });

    it('should return multiple events when multiple actions occur', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      shortUrl.incrementClickCount();
      shortUrl.url = 'https://newurl.com';

      const events = shortUrl.pullEvents();
      expect(events).toHaveLength(3); // create + click + change
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid urls', () => {
      expect(ShortUrl.isValidUrl('https://example.com')).toBe(true);
      expect(ShortUrl.isValidUrl('http://test.com')).toBe(true);
      expect(ShortUrl.isValidUrl('a')).toBe(true);
    });

    it('should return false for invalid urls', () => {
      expect(ShortUrl.isValidUrl('')).toBe(false);
      expect(ShortUrl.isValidUrl('   ')).toBe(false);
    });
  });

  describe('isValidHash', () => {
    it('should return true for valid hashes', () => {
      expect(ShortUrl.isValidHash('abc123')).toBe(true);
      expect(ShortUrl.isValidHash('ABC123')).toBe(true);
      expect(ShortUrl.isValidHash('0123456789')).toBe(true);
      expect(ShortUrl.isValidHash('aZ9')).toBe(true);
    });

    it('should return false for invalid hashes', () => {
      expect(ShortUrl.isValidHash('')).toBe(false);
      expect(ShortUrl.isValidHash('!@#')).toBe(false);
      expect(ShortUrl.isValidHash('   ')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(ShortUrl.isValidDate(new Date())).toBe(true);
      expect(ShortUrl.isValidDate(new Date('2023-01-01'))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(ShortUrl.isValidDate('2023-01-01' as any)).toBe(false);
      expect(ShortUrl.isValidDate(123456789 as any)).toBe(false);
      expect(ShortUrl.isValidDate(null as any)).toBe(false);
    });
  });

  describe('generateHash', () => {
    it('should generate valid hash for number 0', () => {
      const hash = ShortUrl.generateHash(0);
      expect(hash).toBe('0');
    });

    it('should generate valid hash for positive numbers', () => {
      const hash1 = ShortUrl.generateHash(1);
      expect(hash1).toBe('1');

      const hash62 = ShortUrl.generateHash(62);
      expect(hash62).toBe('10');

      const hash123 = ShortUrl.generateHash(123);
      expect(hash123).toBeDefined();
      expect(typeof hash123).toBe('string');
    });

    it('should generate valid hash for max value', () => {
      const maxValue = Math.pow(62, 6) - 1;
      const hash = ShortUrl.generateHash(maxValue);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should throw InvalidRangeValueError for negative numbers', () => {
      expect(() => {
        ShortUrl.generateHash(-1);
      }).toThrow(InvalidRangeValueError);
    });

    it('should throw InvalidRangeValueError for numbers exceeding max value', () => {
      const maxValue = Math.pow(62, 6) - 1;
      expect(() => {
        ShortUrl.generateHash(maxValue + 1);
      }).toThrow(InvalidRangeValueError);
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = ShortUrl.generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique IDs', () => {
      const id1 = ShortUrl.generateId();
      const id2 = ShortUrl.generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('equals', () => {
    it('should return true when comparing same instance', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      expect(shortUrl.equals(shortUrl)).toBe(true);
    });

    it('should return true when comparing instances with same id', () => {
      const shortUrl1 = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      const shortUrl2 = ShortUrl.fromJSON(
        shortUrl1.toJSON(JSONFormats.CAMEL_CASE),
        JSONFormats.CAMEL_CASE,
      );

      expect(shortUrl1.equals(shortUrl2)).toBe(true);
    });

    it('should return false when comparing instances with different ids', () => {
      const shortUrl1 = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      const shortUrl2 = ShortUrl.create({
        hash: 'test456',
        url: 'https://test2.com',
      });

      expect(shortUrl1.equals(shortUrl2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    let shortUrl: ShortUrl;

    beforeEach(() => {
      shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });
    });

    it('should convert to snake_case JSON by default', () => {
      const json = shortUrl.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('url');
      expect(json).toHaveProperty('hash');
      expect(json).toHaveProperty('click_count');
      expect(json).toHaveProperty('created_at');
      expect(json).toHaveProperty('updated_at');
      expect(json.click_count).toBe(0);
    });

    it('should convert to snake_case JSON explicitly', () => {
      const json = shortUrl.toJSON(JSONFormats.SNAKE_CASE);

      expect(json).toHaveProperty('click_count');
      expect(json).toHaveProperty('created_at');
      expect(json).toHaveProperty('updated_at');
    });

    it('should convert to camelCase JSON', () => {
      const json = shortUrl.toJSON(JSONFormats.CAMEL_CASE);

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('url');
      expect(json).toHaveProperty('hash');
      expect(json).toHaveProperty('clickCount');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
      expect(json.clickCount).toBe(0);
    });

    it('should include userId in snake_case JSON when present', () => {
      const shortUrlWithUser = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
        userId: 'user-789',
      });

      const json = shortUrlWithUser.toJSON(JSONFormats.SNAKE_CASE);
      expect(json.user_id).toBe('user-789');
    });

    it('should include userId in camelCase JSON when present', () => {
      const shortUrlWithUser = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
        userId: 'user-789',
      });

      const json = shortUrlWithUser.toJSON(JSONFormats.CAMEL_CASE);
      expect(json.userId).toBe('user-789');
    });
  });

  describe('fromJSON', () => {
    it('should create ShortUrl from snake_case JSON by default', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://test.com',
        hash: 'test123',
        click_count: 5,
        created_at: new Date().toJSON(),
        updated_at: new Date().toJSON(),
      };

      const shortUrl = ShortUrl.fromJSON(json);

      expect(shortUrl).toBeInstanceOf(ShortUrl);
      expect(shortUrl.id).toBe(json.id);
      expect(shortUrl.clickCount).toBe(5);
    });

    it('should create ShortUrl from snake_case JSON explicitly', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://test.com',
        hash: 'test123',
        click_count: 10,
        created_at: new Date().toJSON(),
        updated_at: new Date().toJSON(),
      };

      const shortUrl = ShortUrl.fromJSON(json, JSONFormats.SNAKE_CASE);

      expect(shortUrl).toBeInstanceOf(ShortUrl);
      expect(shortUrl.clickCount).toBe(10);
    });

    it('should create ShortUrl from camelCase JSON', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://test.com',
        hash: 'test123',
        clickCount: 15,
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON(),
      };

      const shortUrl = ShortUrl.fromJSON(json, JSONFormats.CAMEL_CASE);

      expect(shortUrl).toBeInstanceOf(ShortUrl);
      expect(shortUrl.id).toBe(json.id);
      expect(shortUrl.url).toBe(json.url);
      expect(shortUrl.hash).toBe(json.hash);
      expect(shortUrl.clickCount).toBe(15);
      expect(shortUrl.createdAt).toBeInstanceOf(Date);
      expect(shortUrl.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle date conversion correctly', () => {
      const now = new Date();
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://test.com',
        hash: 'test123',
        clickCount: 0,
        createdAt: now.toJSON(),
        updatedAt: now.toJSON(),
      };

      const shortUrl = ShortUrl.fromJSON(json, JSONFormats.CAMEL_CASE);

      expect(shortUrl.createdAt).toBeInstanceOf(Date);
      expect(shortUrl.updatedAt).toBeInstanceOf(Date);
      expect(shortUrl.createdAt.toJSON()).toBe(now.toJSON());
    });

    it('should handle userId in snake_case JSON', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://test.com',
        hash: 'test123',
        click_count: 5,
        user_id: 'user-abc',
        created_at: new Date().toJSON(),
        updated_at: new Date().toJSON(),
      };

      const shortUrl = ShortUrl.fromJSON(json, JSONFormats.SNAKE_CASE);
      expect(shortUrl.userId).toBe('user-abc');
    });

    it('should handle userId in camelCase JSON', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://test.com',
        hash: 'test123',
        clickCount: 5,
        userId: 'user-xyz',
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON(),
      };

      const shortUrl = ShortUrl.fromJSON(json, JSONFormats.CAMEL_CASE);
      expect(shortUrl.userId).toBe('user-xyz');
    });
  });

  describe('integration: toJSON and fromJSON', () => {
    it('should maintain data integrity through snake_case serialization cycle', () => {
      const original = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      const json = original.toJSON(JSONFormats.SNAKE_CASE);
      const restored = ShortUrl.fromJSON(json, JSONFormats.SNAKE_CASE);

      expect(restored.id).toBe(original.id);
      expect(restored.clickCount).toBe(original.clickCount);
    });

    it('should maintain data integrity through camelCase serialization cycle', () => {
      const original = ShortUrl.create({
        hash: 'test456',
        url: 'https://example.com',
      });

      const json = original.toJSON(JSONFormats.CAMEL_CASE);
      const restored = ShortUrl.fromJSON(json, JSONFormats.CAMEL_CASE);

      expect(restored.id).toBe(original.id);
      expect(restored.url).toBe(original.url);
      expect(restored.hash).toBe(original.hash);
      expect(restored.clickCount).toBe(original.clickCount);
    });

    it('should maintain userId through serialization cycle', () => {
      const original = ShortUrl.create({
        hash: 'test456',
        url: 'https://example.com',
        userId: 'user-test',
      });

      const jsonSnake = original.toJSON(JSONFormats.SNAKE_CASE);
      const restoredSnake = ShortUrl.fromJSON(
        jsonSnake,
        JSONFormats.SNAKE_CASE,
      );
      expect(restoredSnake.userId).toBe('user-test');

      const jsonCamel = original.toJSON(JSONFormats.CAMEL_CASE);
      const restoredCamel = ShortUrl.fromJSON(
        jsonCamel,
        JSONFormats.CAMEL_CASE,
      );
      expect(restoredCamel.userId).toBe('user-test');
    });
  });
});
