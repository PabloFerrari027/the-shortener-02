import { BaseHandler } from '@/shared/common/base-handler';
import { Env } from '@/shared/env';
import { Queue, QueuePort } from '@/shared/ports/queue.port';
import { Injectable } from '@nestjs/common';
import { Queue as BullMQQueue, Worker } from 'bullmq';

@Injectable()
class CustomBullQueue extends Queue {
  private queue: BullMQQueue;
  private worker: Worker | null = null;
  private handlers: BaseHandler[];
  private _key: string;

  constructor(key: string) {
    super();
    this._key = key;
    this.handlers = [];

    this.queue = new BullMQQueue(key, {
      connection: {
        host: Env.REDIS_HOST,
        port: Env.REDIS_PORT,
        password: Env.REDIS_PASS,
        username: Env.REDIS_USERNAME,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  get key(): string {
    return this._key;
  }

  async publish(data: any): Promise<void> {
    await this.queue.add(this._key, data);
  }

  subscribe(handler: BaseHandler): void {
    this.handlers.push(handler);
  }

  async process(): Promise<void> {
    this.worker = new Worker(
      this.key,
      async (job) => {
        for (const handler of this.handlers) {
          await handler.execute(job.data);
        }
      },
      {
        connection: {
          host: Env.REDIS_HOST,
          port: Env.REDIS_PORT,
          password: Env.REDIS_PASS,
          username: Env.REDIS_USERNAME,
        },
        concurrency: 1,
      },
    );
  }

  async close(): Promise<void> {
    if (this.worker) await this.worker.close();
    await this.queue.close();
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
