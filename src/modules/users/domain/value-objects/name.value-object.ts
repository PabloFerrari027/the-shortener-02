import { isEmpty } from 'class-validator';
import { InvalidNameError } from '../errors/invalid-name.error';

export class Name {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Name | string): boolean {
    if (typeof other === 'string') return this._value === other;
    return this._value === other._value;
  }

  static compare(a: Name, b: Name): boolean {
    return a.equals(b);
  }

  static isValid(value: string): boolean {
    const isValid = !isEmpty(value);
    return isValid;
  }

  static create(value: string): Name {
    if (!this.isValid(value)) throw new InvalidNameError(value);
    return new Name(value);
  }
}
