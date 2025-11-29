import { CustomError } from '@/shared/common/custom-error';

export class InvalidCodeValidationError extends CustomError {
  constructor(code: string) {
    super(`Invalid code validation: ${code}`, 400);
  }
}
