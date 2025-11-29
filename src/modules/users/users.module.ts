import { Module } from '@nestjs/common';
import { ListUsersService } from './application/services/list-users.service';
import { RemoveUserService } from './application/services/remove-user.service';
import { UpdateUserService } from './application/services/update-user.service';
import { UsersController } from './application/users.controller';
import { AuthGuard } from '../auth/infra/guards/auth.guard';
import { AdminGuard } from '../auth/infra/guards/admin.guard';

@Module({
  controllers: [UsersController],
  providers: [
    ListUsersService,
    RemoveUserService,
    UpdateUserService,
    AuthGuard,
    AdminGuard,
  ],
})
export class UsersModule {}
