import { BaseHandler } from '@/shared/common/base-handler';
import { Env } from '@/shared/env';
import { Queue, QueuePort } from '@/shared/ports/queue.port';
import { Injectable } from '@nestjs/common';
import Bull from 'bull';

@Injectable()
class CustomBullQueue extends Queue {
  private queue: Bull.Queue;
  private handlers: BaseHandler[];
  private _key: string;

  constructor(key: string) {
    super();
    this._key = key;
    this.handlers = [];
    this.queue = new Bull(key, Env.REDIS_URL, {
      defaultJobOptions: { removeOnComplete: true, removeOnFail: false },
    });
  }

  get key(): string {
    return this._key;
  }

  async publish(data: any): Promise<void> {
    await this.queue.add(data);
  }

  subscribe(handler: BaseHandler): void {
    this.handlers.push(handler);
  }

  async process(): Promise<void> {
    await this.queue.process(1, async ({ data }, done) => {
      try {
        for (const handler of this.handlers) {
          await handler.execute(data);
        }
        done();
      } catch (error) {
        done(error as Error);
      }
    });
  }
}

@Injectable()
export class BullQueueAdapter implements QueuePort {
  private queues: Record<string, Queue>;

  constructor() {
    this.queues = {};
  }

  async create(key: string): Promise<Queue> {
    if (this.queues[key]) return this.queues[key];
    const queue = new CustomBullQueue(key);
    this.queues[key] = queue;
    return queue;
  }

  async get(key: string): Promise<Queue | null> {
    return this.queues[key] ?? null;
  }
}
