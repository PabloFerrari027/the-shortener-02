import { CustomError } from '@/shared/common/custom-error';

export class RootUserRoleChangeNotAllowedError extends CustomError {
  constructor() {
    super(`The root user cannot have its role changed`, 403);
  }
}
