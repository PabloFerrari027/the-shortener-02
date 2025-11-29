import { CustomError } from '@/shared/common/custom-error';

export class CodeValidationExpiredError extends CustomError {
  constructor(code: string) {
    super(`Code validation expired: ${code}`, 410);
  }
}
