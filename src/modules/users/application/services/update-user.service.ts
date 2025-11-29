import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Bus } from '@/shared/domain-events/bus';
import { User, UserRole } from '../../domain/entities/user.entity';

type Input = { id: string; role?: UserRole };
type Output = Promise<{ user: User }>;

@Injectable()
export class UpdateUserService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(input: Input): Output {
    const user = await this.usersRepository.findById(input.id);

    if (!user) throw new UserNotFoundError(input.id);

    if (input.role) user.role = input.role;
    await this.usersRepository.update(user);
    await Bus.dispatch(user.pullEvents());

    return { user };
  }
}
