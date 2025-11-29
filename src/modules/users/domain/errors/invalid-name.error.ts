import { CustomError } from '@/shared/common/custom-error';

export class InvalidNameError extends CustomError {
  constructor(name: string) {
    super(`Invalid name: ${name}`, 400);
  }
}
