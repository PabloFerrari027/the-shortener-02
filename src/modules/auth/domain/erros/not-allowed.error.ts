import { CustomError } from '@/shared/common/custom-error';

export class NotAllowedError extends CustomError {
  constructor() {
    super(`Unauthorized`, 403);
  }
}
