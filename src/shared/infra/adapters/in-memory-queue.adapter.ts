import { BaseHandler } from '@/shared/common/base-handler';
import { Queue, QueuePort } from '@/shared/ports/queue.port';
import { Injectable } from '@nestjs/common';

@Injectable()
class InMemoryQueue extends Queue {
  private handlers: BaseHandler[] = [];
  private _key: string;
  private jobs: any[] = [];
  private processingRegistered = false;

  constructor(key: string) {
    super();
    this._key = key;
  }

  get key(): string {
    return this._key;
  }

  async publish(data: any): Promise<void> {
    this.jobs.push(data);

    if (!this.processingRegistered) return;

    await this.consume();
  }

  subscribe(handler: BaseHandler): void {
    this.handlers.push(handler);
  }

  async process(): Promise<void> {
    if (this.processingRegistered) return;
    this.processingRegistered = true;

    await this.consume();
  }

  private async consume(): Promise<void> {
    for (const job of this.jobs) {
      this.jobs.shift();

      for (const handler of this.handlers) {
        try {
          await handler.execute(job);
        } catch (err) {
          console.error(`[InMemoryQueue:${this._key}] Handler failed`, err);
        }
      }
    }
  }
}

export class InMemoryQueueAdapter implements QueuePort {
  private queues: Record<string, Queue>;

  constructor() {
    this.queues = {};
  }

  async create(key: string): Promise<Queue> {
    const queue = new InMemoryQueue(key);
    this.queues[key] = queue;
    return queue;
  }

  async get(key: string): Promise<Queue | null> {
    return this.queues[key] ?? null;
  }
}
