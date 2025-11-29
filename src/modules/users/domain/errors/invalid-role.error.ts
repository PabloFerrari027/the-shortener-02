import { CustomError } from '@/shared/common/custom-error';

export class InvalidRoleError extends CustomError {
  constructor(role: string) {
    super(`Invalid role: ${role}`, 400);
  }
}
