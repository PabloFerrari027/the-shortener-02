import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from 'src/modules/users/domain/errors/user-not-found.error';
import type { SessionsRepository } from 'src/modules/auth/domain/repositories/sessions.repository';
import type { CodeValidationRepository } from 'src/modules/auth/domain/repositories/code-validation.repository';
import type {
  Language,
  VerificationCodeTemplate,
} from 'src/modules/auth/templates/verification-code.template';
import { SessionNotFoundError } from 'src/modules/auth/domain/erros/session-not-found.error';
import { CodeValidation } from 'src/modules/auth/domain/entities/code-validation.entity';
import { BaseHandler } from '@/shared/common/base-handler';
import { Env } from '@/shared/env';
import type { NotificationPort } from '@/shared/ports/notification.port';

interface Input {
  sessionId: string;
}

@Injectable()
export class SendCodeValidationHandler extends BaseHandler {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
    @Inject('CodeValidationRepository')
    private readonly codeValidationRepository: CodeValidationRepository,
    @Inject('NotificationPort')
    private readonly notificationPort: NotificationPort,
    @Inject('VerificationCodeTemplate')
    private readonly verificationCodeTemplate: VerificationCodeTemplate,
  ) {
    super();
  }

  async execute(input: Input): Promise<void> {
    const session = await this.sessionsRepository.findById(input.sessionId);

    if (!session) {
      throw new SessionNotFoundError(input.sessionId);
    }

    const user = await this.usersRepository.findById(session.userId);

    if (!user) throw new UserNotFoundError(session.userId);

    const codeValidation = CodeValidation.create({
      sessionId: session.id,
      value: CodeValidation.generate(),
    });

    await this.codeValidationRepository.create(codeValidation);

    const { body, head } = this.verificationCodeTemplate.generate({
      code: codeValidation.value,
      language: Env.TEMPLATE_LANGUAGE as Language,
      userName: user.name.value,
    });

    await this.notificationPort.send(user.email.value, head, body);
  }
}
