import { CustomError } from '@/shared/common/custom-error';

export class UnauthorizedError extends CustomError {
  constructor() {
    super(`Unauthorized`, 401);
  }
}
