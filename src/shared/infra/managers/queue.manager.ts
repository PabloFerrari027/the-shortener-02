import type { QueuePort } from '@/shared/ports/queue.port';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SendCodeValidationHandler } from 'src/modules/auth/application/handlers/queues/send-code-validation.handler';
import { QueueKeys } from 'src/shared/utils/queue.keys.util';

@Injectable()
export class QueueManager implements OnApplicationBootstrap {
  constructor(
    @Inject('QueuePort')
    private readonly queuePort: QueuePort,
    @Inject()
    private readonly sendCodeValidationHandler: SendCodeValidationHandler,
  ) {}

  async onApplicationBootstrap() {
    return this.execute();
  }

  public async execute() {
    const [sendCodeValidationQueue] = await Promise.all([
      this.queuePort.create(QueueKeys.sendCodeValidation()),
    ]);

    sendCodeValidationQueue.subscribe(this.sendCodeValidationHandler);
    return Promise.all([sendCodeValidationQueue.process()]);
  }
}
