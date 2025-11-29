import { CustomError } from '@/shared/common/custom-error';

export class CodeValidationNotFoundError extends CustomError {
  constructor(code: string) {
    super(`Code validation not found: ${code}`, 404);
  }
}
