import { BaseHandler } from '@/shared/common/base-handler';

export abstract class Queue {
  abstract get key(): string;
  abstract subscribe(handler: BaseHandler): void;
  abstract publish(data: any): Promise<void>;
  abstract process(): Promise<void>;
}

export interface QueuePort {
  create(key: string): Promise<Queue>;
  get(key: string): Promise<Queue | null>;
}
