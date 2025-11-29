import { BaseEvent } from '@/shared/common/base-event';
import { InvalidCodeValidationError } from '../erros/invalid-code-validation.error';
import { CodeValidationRemovedEvent } from '../events/code-validation-removed.event';
import { CodeValidationCreatedEvent } from '../events/code-validation-created.event';
import { CodeValidationUsedEvent } from '../events/code-validation-used.event';

export interface CodeValidationProps {
  id: string;
  sessionId: string;
  value: string;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const JSONFormats = {
  SNAKE_CASE: 'SNAKE_CASE',
  CAMEL_CASE: 'CAMEL_CASE',
} as const;

export type JSONFormat = (typeof JSONFormats)[keyof typeof JSONFormats];

export interface SnakeCaseJSON {
  id: string;
  session_id: string;
  value: string;
  used_at: string | undefined;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CamelCaseJSON {
  id: string;
  sessionId: string;
  value: string;
  usedAt: string | undefined;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CodeValidationJSON<F extends JSONFormat> =
  F extends typeof JSONFormats.SNAKE_CASE ? SnakeCaseJSON : CamelCaseJSON;

export class CodeValidation {
  private readonly props: CodeValidationProps;
  private events: Array<BaseEvent<unknown>>;

  private constructor(
    props: CodeValidationProps,
    events?: Array<BaseEvent<unknown>>,
  ) {
    if (!CodeValidation.isValid(props.value)) {
      throw new InvalidCodeValidationError(props.value);
    }

    this.props = props;
    this.events = events ?? [];
  }

  get id(): string {
    return this.props.id;
  }

  get sessionId(): string {
    return this.props.sessionId;
  }

  get value(): string {
    return this.props.value;
  }

  get usedAt(): Date | undefined {
    return this.props.usedAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  set usedAt(value: Date) {
    this.props.usedAt = value;
    this.touch();
    this.events.push(
      new CodeValidationUsedEvent({ occurredOn: new Date(), id: this.id }),
    );
  }

  toJSON<F extends JSONFormat>(format: F): CodeValidationJSON<F> {
    switch (format) {
      case JSONFormats.SNAKE_CASE:
        return {
          id: this.id,
          value: this.value,
          session_id: this.sessionId,
          used_at: this.usedAt?.toJSON(),
          expires_at: this.expiresAt.toJSON(),
          created_at: this.createdAt.toJSON(),
          updated_at: this.updatedAt.toJSON(),
        } as CodeValidationJSON<F>;

      case JSONFormats.CAMEL_CASE:
        return {
          id: this.id,
          value: this.value,
          sessionId: this.sessionId,
          usedAt: this.usedAt?.toJSON(),
          expiresAt: this.expiresAt.toJSON(),
          createdAt: this.createdAt.toJSON(),
          updatedAt: this.updatedAt.toJSON(),
        } as CodeValidationJSON<F>;
    }
  }

  equals(other: CodeValidation): boolean {
    return (
      JSON.stringify(this.toJSON('CAMEL_CASE')) ===
      JSON.stringify(other.toJSON('CAMEL_CASE'))
    );
  }

  isUsed(): boolean {
    return !!this.usedAt;
  }

  isExpired(): boolean {
    return this.expiresAt.getTime() < new Date().getTime();
  }

  static compare(a: CodeValidation, b: CodeValidation): boolean {
    return a.equals(b);
  }

  static fromJSON<F extends JSONFormat>(
    format: F,
    json: CodeValidationJSON<F>,
  ): CodeValidation {
    switch (format) {
      case JSONFormats.SNAKE_CASE: {
        return new CodeValidation({
          id: (json as SnakeCaseJSON).id,
          sessionId: (json as SnakeCaseJSON).session_id,
          value: (json as SnakeCaseJSON).value,
          usedAt: (json as SnakeCaseJSON)?.used_at
            ? new Date((json as SnakeCaseJSON).used_at as string)
            : undefined,
          expiresAt: new Date((json as SnakeCaseJSON).expires_at),
          createdAt: new Date((json as SnakeCaseJSON).created_at),
          updatedAt: new Date((json as SnakeCaseJSON).updated_at),
        });
      }

      case JSONFormats.CAMEL_CASE: {
        return new CodeValidation({
          id: (json as CamelCaseJSON).id,
          sessionId: (json as CamelCaseJSON).sessionId,
          value: (json as CamelCaseJSON).value,
          usedAt: (json as CamelCaseJSON)?.usedAt
            ? new Date((json as CamelCaseJSON).usedAt as string)
            : undefined,
          expiresAt: new Date((json as CamelCaseJSON).expiresAt),
          createdAt: new Date((json as CamelCaseJSON).createdAt),
          updatedAt: new Date((json as CamelCaseJSON).updatedAt),
        });
      }
    }
  }

  static generate(): string {
    return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  }

  static isValid(value: string): boolean {
    return /^[0-9]{6}$/.test(value);
  }

  static generateId(): string {
    return crypto.randomUUID();
  }

  static create(
    props: Omit<
      CodeValidationProps,
      'id' | 'expiresAt' | 'createdAt' | 'updatedAt'
    >,
  ): CodeValidation {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const id = this.generateId();

    const event = new CodeValidationCreatedEvent({
      occurredOn: new Date(),
      id,
    });

    return new CodeValidation(
      {
        ...props,
        id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      [event],
    );
  }

  remove() {
    const event = new CodeValidationRemovedEvent({
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
