import { SessionCreatedEvent } from '@/modules/auth/domain/events/session-created.event';
import { BaseHandler } from '@/shared/common/base-handler';
import type { Queue, QueuePort } from '@/shared/ports/queue.port';
import { QueueKeys } from '@/shared/utils/queue.keys.util';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class SessionCreatedHandler extends BaseHandler {
  private queue: Queue | null;

  constructor(
    @Inject('QueuePort')
    private readonly queuePort: QueuePort,
  ) {
    super();
    this.queue = null;
  }

  async execute(event: SessionCreatedEvent) {
    this.queue = await this.queuePort.get(QueueKeys.sendCodeValidation());

    if (!this.queue) {
      this.queue = await this.queuePort.create(QueueKeys.sendCodeValidation());
    }

    await this.queue.publish({ sessionId: event.props.id });
  }
}
