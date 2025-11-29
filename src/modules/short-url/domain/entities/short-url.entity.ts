import {
  JSONFormat,
  JSONFormats,
} from '../../../../shared/types/json-format.type';
import { InvalidShortUrlFieldError } from '../errors/invalid-short-url-field.error';
import { InvalidRangeValueError } from '../errors/invalid-range-value.error';
import { BaseEvent } from '@/shared/common/base-event';
import { ShortUrlChangedEvent } from '../events/short-url-changed.event';
import { ShortUrlClickedEvent } from '../events/short-url-clicked.event';
import { ShortUrlRemovedEvent } from '../events/short-url-removed.event';
import { ShortUrlCreatedEvent } from '../events/short-url-created.event';

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
  private events: Array<BaseEvent<unknown>>;

  protected constructor(
    props: ShortUrlProps,
    events?: Array<BaseEvent<unknown>>,
  ) {
    if (!ShortUrl.isValidUrl(props.url)) {
      throw new InvalidShortUrlFieldError('url');
    }

    if (!ShortUrl.isValidHash(props.hash)) {
      throw new InvalidShortUrlFieldError('hash');
    }

    this.props = props;
    this.events = events ?? [];
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

    const event = new ShortUrlChangedEvent({
      id: this.id,
      to: value,
      from: this.url,
      occurredOn: new Date(),
    });
    this.props.url = value;
    this.touch();
    this.events.push(event);
  }

  incrementClickCount(): void {
    this.props.clickCount += 1;
    this.touch();
    const event = new ShortUrlClickedEvent({
      id: this.id,
      occurredOn: new Date(),
    });
    this.events.push(event);
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

  static generateId(): string {
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
    const id = this.generateId();
    const event = new ShortUrlCreatedEvent({ id, occurredOn: new Date() });

    return new ShortUrl(
      {
        ...props,
        id,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      [event],
    );
  }

  remove() {
    const event = new ShortUrlRemovedEvent({
      ...this.toJSON('SNAKE_CASE'),
      occurredOn: new Date(),
    });
    this.events.push(event);
  }

  pullEvents(): Array<BaseEvent<unknown>> {
    const events = this.events;
    this.events = [];
    return events;
  }
}
