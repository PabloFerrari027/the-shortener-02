import type { EncodingPort } from '@/shared/ports/encoding.port';
import type { SessionsRepository } from '../../domain/repositories/sessions.repository';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';

interface Payload {
  sessionId: string;
  expiresAt: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject('EncodingPort')
    private readonly encodingPort: EncodingPort,
    @Inject('SessionsRepository')
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];

      if (!authHeader) return false;

      const rawToken: string = authHeader.split(' ')[1] ?? '';

      if (!rawToken) return false;

      const decodedToken = await this.encodingPort.dencode(rawToken);
      const payload: Payload = JSON.parse(String(decodedToken));

      const session = await this.sessionsRepository.findById(payload.sessionId);

      request.session = session?.toJSON('CAMEL_CASE');

      return true;
    } catch {
      return false;
    }
  }
}
