import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { Bus } from 'src/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';
import { UserNotFoundError } from 'src/modules/users/domain/errors/user-not-found.error';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import { UnauthorizedError } from '../../domain/erros/unauthorized.error';
import type { HasherPort } from '@/shared/ports/hasher.port';

type Input = {
  email: string;
  password: string;
};

type Output = Promise<{
  session: Session;
  accessToken: string;
  refreshToken: string;
}>;

@Injectable()
export class LoginService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
    @Inject('EncodingPort')
    private readonly encodingPort: EncodingPort,
    @Inject('HasherPort')
    private readonly hasherPort: HasherPort,
  ) {}

  async execute(input: Input): Output {
    const user = await this.usersRepository.findByEmail(input.email);

    if (!user) throw new UserNotFoundError(input.email);

    const isValidPass = await this.hasherPort.compare(
      input.password,
      user.password.value,
    );

    if (!isValidPass) throw new UnauthorizedError();

    const accessTokenExpiresAt = new Date();
    const refreshTokenExpiresAt = new Date();

    accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);
    refreshTokenExpiresAt.setMonth(refreshTokenExpiresAt.getMonth() + 1);

    const session = Session.create({ userId: user.id });

    const accessTokenPayload = JSON.stringify({
      sessionId: session.id,
      expiresAt: accessTokenExpiresAt,
    });

    const refreshTokenPayload = JSON.stringify({
      sessionId: session.id,
      expiresAt: refreshTokenExpiresAt,
    });

    const accessToken = await this.encodingPort.encode(accessTokenPayload);
    const refreshToken = await this.encodingPort.encode(refreshTokenPayload);

    await this.usersRepository.update(user);
    await this.sessionsRepository.create(session);

    await Bus.dispatch(session.pullEvents());
    await Bus.dispatch(user.pullEvents());

    return { session, accessToken, refreshToken };
  }
}
