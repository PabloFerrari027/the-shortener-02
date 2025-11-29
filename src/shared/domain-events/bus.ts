import { BaseEvent } from '../common/base-event';
import { BaseHandler } from '../common/base-handler';

export class Bus {
  private static handlers = new Map<string, BaseHandler[]>();

  static register(eventName: string, handler: BaseHandler) {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  static async dispatch(events: Array<BaseEvent<unknown>>) {
    for (const event of events) {
      const handlers = this.handlers.get(event.constructor.name) ?? [];
      await Promise.all(
        handlers.map(async (handler) => await handler.execute(event)),
      );
    }
  }

  static clearHandlers(): void {
    Bus.handlers.clear();
  }
}
