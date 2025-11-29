import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedError } from '../../domain/erros/unauthorized.error';
import { UserRole } from '@/modules/users/domain/entities/user.entity';
import type { UsersRepository } from '@/modules/users/domain/repositories/users.repository';
import type { EncodingPort } from '@/shared/ports/encoding.port';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';

interface Payload {
  sessionId: string;
  expiresAt: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject('EncodingPort')
    private readonly encodingPort: EncodingPort,
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const rawToken = this.extractTokenFromHeader(request);

      if (!rawToken) throw new UnauthorizedError();

      const decodedToken = await this.encodingPort.dencode(rawToken);
      const payload: Payload = JSON.parse(String(decodedToken));

      if (!payload.sessionId) throw new UnauthorizedError();

      const session = await this.sessionsRepository.findById(payload.sessionId);

      if (!session) throw new UnauthorizedError();

      const user = await this.usersRepository.findById(session.userId);

      if (!user) throw new UnauthorizedError();

      if (user.role !== UserRole.ADMIN) throw new UnauthorizedError();

      return true;
    } catch {
      throw new UnauthorizedError();
    }
  }
}
