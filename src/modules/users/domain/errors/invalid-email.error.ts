import { CustomError } from '@/shared/common/custom-error';

export class InvalidEmailError extends CustomError {
  constructor(email: string) {
    super(`Invalid email: ${email}`, 400);
  }
}
