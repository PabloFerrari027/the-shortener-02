import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { Email } from '@/modules/users/domain/value-objects/email.value-object';
import { UserAlreadyExistsError } from '../../../users/domain/errors/user-already-exists.error';
import { User, UserRole } from 'src/modules/users/domain/entities/user.entity';
import { Name } from '@/modules/users/domain/value-objects/name.value-object';
import { Session } from '../../domain/entities/session.entity';
import { Bus } from '@/shared/domain-events/bus';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import { Password } from '@/modules/users/domain/value-objects/password.value-object';
import type { HasherPort } from '@/shared/ports/hasher.port';

type Input = {
  name: string;
  email: string;
  password: string;
};

type Output = Promise<{
  session: Session;
  accessToken: string;
  refreshToken: string;
}>;

@Injectable()
export class RegisterService {
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
    const userAlreadyExists = await this.usersRepository.findByEmail(
      input.email,
    );

    if (userAlreadyExists) throw new UserAlreadyExistsError(input.email);

    const hash = await this.hasherPort.hash(input.password);

    const user = User.create({
      name: Name.create(input.name),
      email: Email.create(input.email),
      password: Password.create(hash),
      role: UserRole.CLINET,
    });

    const accessTokenExpiresAt = new Date();
    const refreshTokenExpiresAt = new Date();

    accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);
    refreshTokenExpiresAt.setMonth(refreshTokenExpiresAt.getMonth() + 1);

    const sessionId = Session.generateId();

    const accessTokenPayload = JSON.stringify({
      sessionId,
      expiresAt: accessTokenExpiresAt,
    });

    const refreshTokenPayload = JSON.stringify({
      sessionId,
      expiresAt: refreshTokenExpiresAt,
    });

    const accessToken = await this.encodingPort.encode(accessTokenPayload);
    const refreshToken = await this.encodingPort.encode(refreshTokenPayload);

    const session = Session.create({
      userId: user.id,
    });

    await this.usersRepository.create(user);
    await this.sessionsRepository.create(session);

    await Bus.dispatch(session.pullEvents());
    await Bus.dispatch(user.pullEvents());

    return { session, accessToken, refreshToken };
  }
}
