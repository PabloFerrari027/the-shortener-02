/* eslint-disable @typescript-eslint/no-unused-vars */
type Props<T> = { occurredOn: Date } & T;

export abstract class BaseEvent<T> {
  abstract readonly props: Props<T>;
  constructor(props: Props<T>) {}
}
