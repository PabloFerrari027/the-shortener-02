import { CustomError } from 'src/shared/common/custom-error';

export class ShortUrlNotFoundError extends CustomError {
  constructor(identifier: string) {
    super(`Short URL not found: ${identifier}`, 404);
  }
}
