import { CustomError } from 'src/shared/common/custom-error';

export class InvalidRangeValueError extends CustomError {
  constructor(value: number) {
    super(`Invalid range value: ${value}`, 500);
  }
}
