import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { Bus } from '@/shared/domain-events/bus';

type Input = { id: string };
type Output = Promise<void>;

@Injectable()
export class RemoveUserService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(input: Input): Output {
    const user = await this.usersRepository.findById(input.id);

    if (!user) throw new UserNotFoundError(input.id);

    user.remove();
    await this.usersRepository.delete(input.id);
    await Bus.dispatch(user.pullEvents());
  }
}
