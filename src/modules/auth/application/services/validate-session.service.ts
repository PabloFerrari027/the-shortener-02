import { Inject, Injectable } from '@nestjs/common';
import type { CodeValidationRepository } from '../../domain/repositories/code-validation.repository';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { CodeValidationNotFoundError } from '../../domain/erros/code-validation-not-found.error';
import { SessionNotFoundError } from '../../domain/erros/session-not-found.error';
import { CodeValidationExpiredError } from '../../domain/erros/code-validation-expired.error';
import { SessionAlreadyValidatedError } from '../../domain/erros/session-alredy-validated.error';
import { CodeDoesNotBelongToSessionError } from '../../domain/erros/code-does-not-belong-to-session.error';
import { Bus } from '@/shared/domain-events/bus';

type Input = {
  code: string;
  sessionId: string;
};

type Output = Promise<void>;

@Injectable()
export class ValidateSessionService {
  constructor(
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
    @Inject('CodeValidationRepository')
    private readonly codeValidationRepository: CodeValidationRepository,
  ) {}

  async execute(input: Input): Output {
    const codeValidation = await this.codeValidationRepository.findByValue(
      input.code,
    );

    if (!codeValidation) throw new CodeValidationNotFoundError(input.code);

    if (codeValidation.isExpired()) {
      throw new CodeValidationExpiredError(input.code);
    }

    const session = await this.sessionsRepository.findById(input.sessionId);

    if (!session) throw new SessionNotFoundError(input.sessionId);

    if (session.validatedAt) {
      throw new SessionAlreadyValidatedError(input.sessionId);
    }

    if (session.id !== codeValidation.sessionId) {
      throw new CodeDoesNotBelongToSessionError();
    }

    session.validate();
    await this.sessionsRepository.update(session);
    await Bus.dispatch(session.pullEvents());
    await Bus.dispatch(codeValidation.pullEvents());
  }
}
