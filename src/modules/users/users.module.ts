import { Module } from '@nestjs/common';
import { ListUsersService } from './application/services/list-users.service';
import { RemoveUserService } from './application/services/remove-user.service';
import { UpdateUserService } from './application/services/update-user.service';
import { UsersController } from './application/users.controller';

@Module({
  controllers: [UsersController],
  providers: [ListUsersService, RemoveUserService, UpdateUserService],
})
export class UsersModule {}
