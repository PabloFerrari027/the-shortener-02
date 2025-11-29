import { CustomError } from '@/shared/common/custom-error';

export class SessionAlreadyValidatedError extends CustomError {
  constructor(sessionId: string) {
    super(`Session already validated: ${sessionId}`, 409);
  }
}
