import { Inject, Injectable } from '@nestjs/common';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import { UnauthorizedError } from '../../domain/erros/unauthorized.error';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import { Bus } from '@/shared/domain-events/bus';
import { Session } from '../../domain/entities/session.entity';

type TokenPayload = { sessionId: string; expiresAt: string };

type Input = {
  accessToken: string;
  refreshToken: string;
};

type Output = Promise<{
  session: Session;
  accessToken: string;
  refreshToken: string;
}>;

@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
    @Inject('EncodingPort')
    private readonly encodingPort: EncodingPort,
  ) {}

  async execute(input: Input): Output {
    const decodeAccessToken = await this.encodingPort.dencode(
      input.accessToken,
    );

    const decodeRefreshToken = await this.encodingPort.dencode(
      input.refreshToken,
    );

    const accessTokenPayload = JSON.parse(decodeAccessToken) as TokenPayload;
    const refreshTokenPayload = JSON.parse(decodeRefreshToken) as TokenPayload;

    const isRefreshTokenExpired =
      new Date(refreshTokenPayload.expiresAt) < new Date();

    if (isRefreshTokenExpired) throw new UnauthorizedError();

    if (accessTokenPayload.sessionId !== refreshTokenPayload.sessionId) {
      throw new UnauthorizedError();
    }

    const session = await this.sessionsRepository.findById(
      accessTokenPayload.sessionId,
    );

    if (!session) throw new UnauthorizedError();

    const accessTokenExpiresAt = new Date();
    const refreshTokenExpiresAt = new Date();

    accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);
    refreshTokenExpiresAt.setMonth(refreshTokenExpiresAt.getMonth() + 1);

    const newAccessTokenPayload = JSON.stringify({
      sessionId: session.id,
      expiresAt: accessTokenExpiresAt,
    });

    const newRefreshTokenPayload = JSON.stringify({
      sessionId: session.id,
      expiresAt: refreshTokenExpiresAt,
    });

    const newAccessToken = await this.encodingPort.encode(
      newAccessTokenPayload,
    );

    const newRefreshToken = await this.encodingPort.encode(
      newRefreshTokenPayload,
    );

    await this.sessionsRepository.update(session);
    await Bus.dispatch(session.pullEvents());

    return {
      session,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
