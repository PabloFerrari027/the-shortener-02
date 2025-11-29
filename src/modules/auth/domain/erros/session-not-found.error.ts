import { CustomError } from '@/shared/common/custom-error';

export class SessionNotFoundError extends CustomError {
  constructor(identity: string) {
    super(`Session not found error: ${identity}`, 404);
  }
}
