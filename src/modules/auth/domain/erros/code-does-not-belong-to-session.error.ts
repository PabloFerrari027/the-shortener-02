import { CustomError } from '@/shared/common/custom-error';

export class CodeDoesNotBelongToSessionError extends CustomError {
  constructor() {
    super('The code does not belong to the session', 409);
  }
}
