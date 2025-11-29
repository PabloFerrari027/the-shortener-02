import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { BaseEvent } from '@/shared/common/base-event';
import { UserRemovedEvent } from '../events/user-removed.event';
import { UserCreatedEvent } from '../events/user-created.event';
import { Password } from '../value-objects/password.value-object';
import { InvalidRoleError } from '../errors/invalid-role.error';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { Env } from '@/shared/env';
import { RootUserRoleChangeNotAllowedError } from '../errors/root-user-role-chager-not-allowed.error';

export interface UserProps {
  id: string;
  name: Name;
  email: Email;
  password: Password;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export const JSONFormats = {
  SNAKE_CASE: 'SNAKE_CASE',
  CAMEL_CASE: 'CAMEL_CASE',
} as const;

export type JSONFormat = (typeof JSONFormats)[keyof typeof JSONFormats];

export enum UserRole {
  'ADMIN' = 'admin',
  'CLINET' = 'CLINET',
}

export interface SnakeCaseJSON {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CamelCaseJSON {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserJSON<F extends JSONFormat> =
  F extends typeof JSONFormats.SNAKE_CASE ? SnakeCaseJSON : CamelCaseJSON;

export class User {
  private readonly props: UserProps;
  private events: Array<BaseEvent<unknown>>;

  private constructor(props: UserProps, events?: Array<BaseEvent<unknown>>) {
    this.props = props;
    this.events = events ?? [];
  }

  get id(): string {
    return this.props.id;
  }

  get name(): Name {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set role(role: UserRole) {
    if (role === this.role) return;
    if (!User.isValidRole(role)) throw new InvalidRoleError(role);
    if (this.email.value === Env.ROOT_USER_EMAIL) {
      throw new RootUserRoleChangeNotAllowedError();
    }

    const event = new UserRoleChangedEvent({
      occurredOn: new Date(),
      id: this.id,
      to: role,
      from: this.role,
    });
    this.props.role = role;
    this.events.push(event);
  }

  toJSON<F extends JSONFormat>(format: F): UserJSON<F> {
    switch (format) {
      case JSONFormats.SNAKE_CASE:
        return {
          id: this.id,
          name: this.name.value,
          email: this.email.value,
          password: this.password.value,
          role: this.role,
          created_at: this.createdAt.toJSON(),
          updated_at: this.updatedAt.toJSON(),
        } as UserJSON<F>;

      case JSONFormats.CAMEL_CASE:
        return {
          id: this.id,
          name: this.name.value,
          email: this.email.value,
          password: this.password.value,
          role: this.role,
          createdAt: this.createdAt.toJSON(),
          updatedAt: this.updatedAt.toJSON(),
        } as UserJSON<F>;
    }
  }

  equals(other: User): boolean {
    return (
      JSON.stringify(this.toJSON('CAMEL_CASE')) ===
      JSON.stringify(other.toJSON('CAMEL_CASE'))
    );
  }

  static isValidRole(role: string): boolean {
    return Object.values(UserRole).includes(role as UserRole);
  }

  static compare(a: User, b: User): boolean {
    return a.equals(b);
  }

  static fromJSON<F extends JSONFormat>(format: F, json: UserJSON<F>): User {
    switch (format) {
      case JSONFormats.SNAKE_CASE: {
        return new User({
          id: (json as SnakeCaseJSON).id,
          name: Name.create((json as SnakeCaseJSON).name),
          email: Email.create((json as SnakeCaseJSON).email),
          password: Password.create((json as SnakeCaseJSON).password),
          role: (json as SnakeCaseJSON).role,
          createdAt: new Date((json as SnakeCaseJSON).created_at),
          updatedAt: new Date((json as SnakeCaseJSON).updated_at),
        });
      }

      case JSONFormats.CAMEL_CASE: {
        return new User({
          id: (json as CamelCaseJSON).id,
          name: Name.create((json as CamelCaseJSON).name),
          email: Email.create((json as CamelCaseJSON).email),
          password: Password.create((json as CamelCaseJSON).password),
          role: (json as CamelCaseJSON).role,
          createdAt: new Date((json as CamelCaseJSON).createdAt),
          updatedAt: new Date((json as CamelCaseJSON).updatedAt),
        });
      }
    }
  }

  static generateId(): string {
    return crypto.randomUUID();
  }

  static create(
    props: Omit<UserProps, 'id' | 'updatedAt' | 'createdAt'>,
  ): User {
    const id = this.generateId();
    const event = new UserCreatedEvent({ id, occurredOn: new Date() });

    return new User(
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
    const event = new UserRemovedEvent({
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
