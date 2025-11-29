import { CustomError } from '@/shared/common/custom-error';

export class UserAlreadyExistsError extends CustomError {
  constructor(email: string) {
    super(`User already exists: ${email}`, 400);
  }
}
