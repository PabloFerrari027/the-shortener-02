import { isEmail, isEmpty } from 'class-validator';
import { InvalidEmailError } from '../errors/invalid-email.error';

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  static compare(a: Email, b: Email): boolean {
    return a.equals(b);
  }

  static isValid(value: string): boolean {
    const isValid = !isEmpty(value) && isEmail(value);
    return isValid;
  }

  static create(value: string): Email {
    if (!this.isValid(value)) throw new InvalidEmailError(value);
    return new Email(value);
  }
}
