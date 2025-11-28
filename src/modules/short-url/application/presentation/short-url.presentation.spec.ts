import { ShortUrlPresentation } from './short-url.presentation';
import { ShortUrl } from '../../domain/entities/short-url.entity';

jest.mock('src/shared/env', () => ({
  Env: {
    APP_URL: 'https://short.url',
  },
}));

describe('ShortUrlPresentation', () => {
  const mockAppUrl = 'https://short.url';

  describe('toController - single ShortUrl', () => {
    it('should convert a single ShortUrl to controller format with SNAKE_CASE', () => {
      const shortUrl = ShortUrl.create({
        hash: 'abc123',
        url: 'https://example.com/very-long-url',
      });

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('url', 'https://example.com/very-long-url');
      expect(result).toHaveProperty('hash', 'abc123');
      expect(result).toHaveProperty('click_count', 0);
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
      expect(result).toHaveProperty('short_url', `${mockAppUrl}/abc123`);

      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('total_pages');
      expect(result).not.toHaveProperty('current_page');
    });

    it('should format short_url correctly with hash', () => {
      const shortUrl = ShortUrl.create({
        hash: 'xyz789',
        url: 'https://google.com',
      });

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result.short_url).toBe(`${mockAppUrl}/xyz789`);
      expect(result.hash).toBe('xyz789');
    });

    it('should include click_count in snake_case format', () => {
      const shortUrl = ShortUrl.create({
        hash: 'test123',
        url: 'https://test.com',
      });

      shortUrl.incrementClickCount();
      shortUrl.incrementClickCount();
      shortUrl.incrementClickCount();

      const result = ShortUrlPresentation.toController(shortUrl);
      expect(result.click_count).toBe(3);
      expect(result).not.toHaveProperty('clickCount');
    });

    it('should return ISO string dates for created_at and updated_at', () => {
      const shortUrl = ShortUrl.create({
        hash: 'date123',
        url: 'https://date-test.com',
      });

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(typeof result.created_at).toBe('string');
      expect(typeof result.updated_at).toBe('string');
      expect(() => new Date(result.created_at)).not.toThrow();
      expect(() => new Date(result.updated_at)).not.toThrow();
    });
  });

  describe('toController - array of ShortUrls', () => {
    it('should convert array of ShortUrls to paginated list format', () => {
      const shortUrl1 = ShortUrl.create({
        hash: 'hash1',
        url: 'https://url1.com',
      });

      const shortUrl2 = ShortUrl.create({
        hash: 'hash2',
        url: 'https://url2.com',
      });

      shortUrl1.incrementClickCount();
      shortUrl2.incrementClickCount();
      shortUrl2.incrementClickCount();

      const shortUrls = [shortUrl1, shortUrl2];
      const totalPages = 5;
      const currentPage = 2;

      const result = ShortUrlPresentation.toController(
        shortUrls,
        totalPages,
        currentPage,
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total_pages', totalPages);
      expect(result).toHaveProperty('current_page', currentPage);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('hash', 'hash1');
      expect(result.data[0]).toHaveProperty('url', 'https://url1.com');
      expect(result.data[0]).toHaveProperty('click_count', 1);
      expect(result.data[0]).toHaveProperty('short_url', `${mockAppUrl}/hash1`);
      expect(result.data[1]).toHaveProperty('hash', 'hash2');
      expect(result.data[1]).toHaveProperty('url', 'https://url2.com');
      expect(result.data[1]).toHaveProperty('click_count', 2);
      expect(result.data[1]).toHaveProperty('short_url', `${mockAppUrl}/hash2`);
    });

    it('should handle empty array', () => {
      const shortUrls: ShortUrl[] = [];
      const totalPages = 0;
      const currentPage = 1;

      const result = ShortUrlPresentation.toController(
        shortUrls,
        totalPages,
        currentPage,
      );

      expect(result.data).toEqual([]);
      expect(result.total_pages).toBe(0);
      expect(result.current_page).toBe(1);
    });

    it('should format all items in array with snake_case and short_url', () => {
      const shortUrls = [
        ShortUrl.create({ hash: 'a1', url: 'https://a.com' }),
        ShortUrl.create({ hash: 'b2', url: 'https://b.com' }),
        ShortUrl.create({ hash: 'c3', url: 'https://c.com' }),
      ];

      const result = ShortUrlPresentation.toController(shortUrls, 1, 1);

      result.data.forEach((item, index) => {
        expect(item).toHaveProperty('click_count');
        expect(item).not.toHaveProperty('clickCount');
        expect(item.short_url).toBe(`${mockAppUrl}/${shortUrls[index].hash}`);
      });
    });

    it('should correctly set pagination metadata', () => {
      const shortUrls = [
        ShortUrl.create({ hash: 'test', url: 'https://test.com' }),
      ];
      const totalPages = 10;
      const currentPage = 3;

      const result = ShortUrlPresentation.toController(
        shortUrls,
        totalPages,
        currentPage,
      );

      expect(result.total_pages).toBe(10);
      expect(result.current_page).toBe(3);
      expect(result.data).toHaveLength(1);
    });

    it('should handle large arrays efficiently', () => {
      const shortUrls = Array.from({ length: 50 }, (_, i) =>
        ShortUrl.create({
          hash: `hash${i}`,
          url: `https://url${i}.com`,
        }),
      );

      const result = ShortUrlPresentation.toController(shortUrls, 5, 1);

      expect(result.data).toHaveLength(50);
      expect(result.total_pages).toBe(5);
      expect(result.current_page).toBe(1);

      result.data.forEach((item, index) => {
        expect(item.hash).toBe(`hash${index}`);
        expect(item.short_url).toBe(`${mockAppUrl}/hash${index}`);
      });
    });
  });

  describe('method overloading behavior', () => {
    it('should return single object type when called with single ShortUrl', () => {
      const shortUrl = ShortUrl.create({
        hash: 'single',
        url: 'https://single.com',
      });

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result).toHaveProperty('short_url');
      expect(result).toHaveProperty('hash');
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('total_pages');
    });

    it('should return list object type when called with array', () => {
      const shortUrls = [
        ShortUrl.create({ hash: 'arr1', url: 'https://arr1.com' }),
      ];

      const result = ShortUrlPresentation.toController(shortUrls, 1, 1);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total_pages');
      expect(result).toHaveProperty('current_page');
      expect(result).not.toHaveProperty('short_url');
      expect(result).not.toHaveProperty('hash');
    });
  });

  describe('integration with ShortUrl entity', () => {
    it('should correctly handle ShortUrl with updated properties', () => {
      const shortUrl = ShortUrl.create({
        hash: 'update123',
        url: 'https://original.com',
      });

      shortUrl.url = 'https://updated.com';
      shortUrl.incrementClickCount();

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result.url).toBe('https://updated.com');
      expect(result.click_count).toBe(1);
      expect(result.short_url).toBe(`${mockAppUrl}/update123`);
    });

    it('should preserve all entity data in conversion', () => {
      const shortUrl = ShortUrl.create({
        hash: 'preserve',
        url: 'https://preserve.com',
      });

      const originalId = shortUrl.id;
      const originalHash = shortUrl.hash;
      const originalUrl = shortUrl.url;

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result.id).toBe(originalId);
      expect(result.hash).toBe(originalHash);
      expect(result.url).toBe(originalUrl);
    });

    it('should handle ShortUrl with multiple click increments', () => {
      const shortUrl = ShortUrl.create({
        hash: 'clicks',
        url: 'https://clicks.com',
      });

      for (let i = 0; i < 10; i++) {
        shortUrl.incrementClickCount();
      }

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result.click_count).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle ShortUrl with special characters in hash', () => {
      const shortUrl = ShortUrl.create({
        hash: 'A1b2C3',
        url: 'https://special.com',
      });

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result.short_url).toBe(`${mockAppUrl}/A1b2C3`);
      expect(result.hash).toBe('A1b2C3');
    });

    it('should handle ShortUrl with very long URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      const shortUrl = ShortUrl.create({
        hash: 'long',
        url: longUrl,
      });

      const result = ShortUrlPresentation.toController(shortUrl);

      expect(result.url).toBe(longUrl);
      expect(result.short_url).toBe(`${mockAppUrl}/long`);
    });

    it('should handle pagination with page 1', () => {
      const shortUrls = [
        ShortUrl.create({ hash: 'p1', url: 'https://page1.com' }),
      ];

      const result = ShortUrlPresentation.toController(shortUrls, 1, 1);

      expect(result.current_page).toBe(1);
      expect(result.total_pages).toBe(1);
    });

    it('should handle pagination with last page', () => {
      const shortUrls = [
        ShortUrl.create({ hash: 'last', url: 'https://last.com' }),
      ];

      const result = ShortUrlPresentation.toController(shortUrls, 100, 100);

      expect(result.current_page).toBe(100);
      expect(result.total_pages).toBe(100);
    });
  });
});
