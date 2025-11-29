import { Bus } from 'src/shared/domain-events/bus';
import { SessionCreatedHandler } from 'src/modules/auth/application/handlers/events/session-created.handler';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SessionCreatedEvent } from '@/modules/auth/domain/events/session-created.event';

@Injectable()
export class DomainEventsManager implements OnApplicationBootstrap {
  constructor(
    @Inject()
    private readonly sessionCreatedHandler: SessionCreatedHandler,
  ) {}

  onApplicationBootstrap() {
    this.execute();
  }

  execute() {
    Bus.register(SessionCreatedEvent.name, this.sessionCreatedHandler);
  }
}
