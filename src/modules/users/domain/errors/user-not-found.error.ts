import { CustomError } from '@/shared/common/custom-error';

export class UserNotFoundError extends CustomError {
  constructor(identify: string) {
    super(`User not found: ${identify}`, 404);
  }
}
