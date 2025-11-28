import { CustomError } from 'src/shared/common/custom-error';
import { ShortUrl } from '../entities/short-url.entity';

export class InvalidShortUrlFieldError extends CustomError {
  constructor(field: keyof ShortUrl) {
    super(`Invalid short URL field: ${field}`, 400);
  }
}
