import { BaseEvent } from '@/shared/common/base-event';
import { SessionRemovedEvent } from '../events/session-removed.event';
import { SessionCreatedEvent } from '../events/session-created.event';
import { SessionValidatedEvent } from '../events/session-validated.event';
import { SessionCloseEvent } from '../events/session-close.event';

export interface SessionProps {
  id: string;
  userId: string;
  validatedAt?: Date;
  closedAt?: Date;
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
  user_id: string;
  validated_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CamelCaseJSON {
  id: string;
  userId: string;
  validatedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionJSON<F extends JSONFormat> =
  F extends typeof JSONFormats.SNAKE_CASE ? SnakeCaseJSON : CamelCaseJSON;

export class Session {
  private readonly props: SessionProps;
  private events: Array<BaseEvent<unknown>>;

  private constructor(props: SessionProps, events?: Array<BaseEvent<unknown>>) {
    this.props = props;
    this.events = events ?? [];
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get validatedAt(): Date | undefined {
    return this.props.validatedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  validate() {
    this.props.validatedAt = new Date();
    this.touch();
    this.events.push(
      new SessionValidatedEvent({ occurredOn: new Date(), id: this.id }),
    );
  }

  close() {
    this.props.closedAt = new Date();
    this.touch();
    this.events.push(
      new SessionCloseEvent({ occurredOn: new Date(), id: this.id }),
    );
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  toJSON<F extends JSONFormat>(format: F): SessionJSON<F> {
    switch (format) {
      case JSONFormats.SNAKE_CASE:
        return {
          id: this.id,
          user_id: this.userId,
          validated_at: this.validatedAt?.toJSON(),
          closed_at: this.closedAt?.toJSON(),
          updated_at: this.updatedAt.toJSON(),
          created_at: this.createdAt.toJSON(),
        } as SessionJSON<F>;

      case JSONFormats.CAMEL_CASE:
        return {
          id: this.id,
          userId: this.userId,
          validatedAt: this.validatedAt?.toJSON(),
          closedAt: this.closedAt?.toJSON(),
          updatedAt: this.updatedAt.toJSON(),
          createdAt: this.createdAt.toJSON(),
        } as SessionJSON<F>;
    }
  }

  equals(other: Session): boolean {
    return (
      JSON.stringify(this.toJSON('CAMEL_CASE')) ===
      JSON.stringify(other.toJSON('CAMEL_CASE'))
    );
  }

  static compare(a: Session, b: Session): boolean {
    return a.equals(b);
  }

  static fromJSON<F extends JSONFormat>(
    format: F,
    json: SessionJSON<F>,
  ): Session {
    switch (format) {
      case JSONFormats.SNAKE_CASE: {
        return new Session({
          id: (json as SnakeCaseJSON).id,
          userId: (json as SnakeCaseJSON).user_id,
          validatedAt: (json as SnakeCaseJSON)?.validated_at
            ? new Date((json as SnakeCaseJSON).validated_at as string)
            : undefined,
          closedAt: (json as SnakeCaseJSON)?.closed_at
            ? new Date((json as SnakeCaseJSON).closed_at as string)
            : undefined,
          updatedAt: new Date((json as SnakeCaseJSON).updated_at),
          createdAt: new Date((json as SnakeCaseJSON).created_at),
        });
      }

      case JSONFormats.CAMEL_CASE: {
        return new Session({
          id: (json as CamelCaseJSON).id,
          userId: (json as CamelCaseJSON).userId,
          validatedAt: (json as CamelCaseJSON)?.validatedAt
            ? new Date((json as CamelCaseJSON).validatedAt as string)
            : undefined,
          closedAt: (json as CamelCaseJSON)?.closedAt
            ? new Date((json as CamelCaseJSON).closedAt as string)
            : undefined,
          updatedAt: new Date((json as CamelCaseJSON).updatedAt),
          createdAt: new Date((json as CamelCaseJSON).createdAt),
        });
      }
    }
  }

  static generateId(): string {
    return crypto.randomUUID();
  }

  static create(
    props: Omit<SessionProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Session {
    const id = this.generateId();
    const event = new SessionCreatedEvent({ id, occurredOn: new Date() });

    return new Session(
      {
        ...props,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      [event],
    );
  }

  remove() {
    const event = new SessionRemovedEvent({
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
