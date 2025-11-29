import { Inject, Injectable } from '@nestjs/common';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { SessionNotFoundError } from '../../domain/erros/session-not-found.error';
import { Bus } from '@/shared/domain-events/bus';

type Input = {
  sessionId: string;
};

type Output = Promise<void>;

@Injectable()
export class LogoutService {
  constructor(
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(input: Input): Output {
    const session = await this.sessionsRepository.findById(input.sessionId);

    if (!session) throw new SessionNotFoundError(input.sessionId);

    session.close();
    await Bus.dispatch(session.pullEvents());
    await this.sessionsRepository.update(session);
  }
}
