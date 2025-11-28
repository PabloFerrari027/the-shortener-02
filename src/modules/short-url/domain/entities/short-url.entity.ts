import {
  JSONFormat,
  JSONFormats,
} from '../../../../shared/types/json-format.type';
import { InvalidShortUrlFieldError } from '../errors/invalid-short-url-field.error';
import { InvalidRangeValueError } from '../errors/invalid-range-value.error';

export interface ShortUrlProps {
  id: string;
  hash: string;
  url: string;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnakeCaseJSON {
  id: string;
  url: string;
  hash: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface CamelCaseJSON {
  id: string;
  hash: string;
  url: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ShortUrlJSON<F extends JSONFormat> =
  F extends typeof JSONFormats.CAMEL_CASE ? CamelCaseJSON : SnakeCaseJSON;

export class ShortUrl {
  private props: ShortUrlProps;

  protected constructor(props: ShortUrlProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get hash(): string {
    return this.props.hash;
  }

  get url(): string {
    return this.props.url;
  }

  get clickCount(): number {
    return this.props.clickCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static isValidUrl(value: string): boolean {
    if (value.trim().length < 1) return false;
    return true;
  }

  static isValidHash(value: string): boolean {
    const regex = /^[a-zA-Z0-9]/;
    if (!regex.test(value)) return false;
    return true;
  }

  static isValidDate(value: Date): boolean {
    if (value instanceof Date) return true;
    return false;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  set url(value: string) {
    if (!ShortUrl.isValidUrl(value)) {
      throw new InvalidShortUrlFieldError('url');
    }
    this.props.url = value;
    this.touch();
  }

  incrementClickCount(): void {
    this.props.clickCount += 1;
    this.touch();
  }

  static generateHash(num: number): string {
    const chars =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const maxValue = Math.pow(62, 6) - 1; // 56.800.235.583

    if (num < 0 || num > maxValue) throw new InvalidRangeValueError(num);

    let result = '';
    let n = num;

    do {
      result = chars[n % chars.length] + result;
      n = Math.floor(n / 62);
    } while (n > 0);

    return result;
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }

  public equals(entity: ShortUrl): boolean {
    if (entity === this) return true;
    if (entity.id === this.props.id) return true;
    return false;
  }

  public toJSON<F extends JSONFormat = typeof JSONFormats.SNAKE_CASE>(
    format: F = JSONFormats.SNAKE_CASE as F,
  ): ShortUrlJSON<F> {
    switch (format) {
      case JSONFormats.SNAKE_CASE: {
        const json: ShortUrlJSON<F> = {
          id: this.id,
          url: this.url,
          hash: this.hash,
          click_count: this.clickCount,
          updated_at: this.updatedAt.toJSON(),
          created_at: this.createdAt.toJSON(),
        } as ShortUrlJSON<F>;
        return json;
      }

      case JSONFormats.CAMEL_CASE: {
        const json: ShortUrlJSON<F> = {
          id: this.id,
          hash: this.hash,
          url: this.url,
          clickCount: this.clickCount,
          updatedAt: this.updatedAt.toJSON(),
          createdAt: this.createdAt.toJSON(),
        } as ShortUrlJSON<F>;
        return json;
      }
    }
  }

  public static fromJSON<F extends JSONFormat = typeof JSONFormats.SNAKE_CASE>(
    json: ShortUrlJSON<F>,
    format: F = JSONFormats.SNAKE_CASE as F,
  ): ShortUrl {
    switch (format) {
      case JSONFormats.SNAKE_CASE: {
        const snakeJson = json as SnakeCaseJSON;
        return new ShortUrl({
          id: snakeJson.id,
          url: snakeJson.url,
          hash: snakeJson.hash,
          clickCount: snakeJson.click_count,
          createdAt: new Date(snakeJson.created_at),
          updatedAt: new Date(snakeJson.updated_at),
        });
      }

      case JSONFormats.CAMEL_CASE: {
        const camelJson = json as CamelCaseJSON;
        return new ShortUrl({
          id: camelJson.id,
          url: camelJson.url,
          hash: camelJson.hash,
          clickCount: camelJson.clickCount,
          createdAt: new Date(camelJson.createdAt),
          updatedAt: new Date(camelJson.updatedAt),
        });
      }
    }
  }

  static create(
    props: Omit<ShortUrlProps, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'>,
  ): ShortUrl {
    if (!this.isValidUrl(props.url)) {
      throw new InvalidShortUrlFieldError('url');
    }

    if (!this.isValidHash(props.hash)) {
      throw new InvalidShortUrlFieldError('hash');
    }

    return new ShortUrl({
      ...props,
      id: this.generateId(),
      clickCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
