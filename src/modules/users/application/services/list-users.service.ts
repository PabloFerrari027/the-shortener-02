import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from 'src/modules/users/domain/repositories/users.repository';
import { User, UserProps } from '../../domain/entities/user.entity';
import { Order } from '@/shared/types/pagination-options.type';

type Input = { page: number; orderBy?: keyof UserProps; order?: Order };

type Output = Promise<{
  totalPages: number;
  currentPage: number;
  data: Array<User>;
}>;

@Injectable()
export class ListUsersService {
  constructor(
    @Inject('UsersRepository')
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(input: Input): Output {
    const response = await this.usersRepository.list({
      page: input.page,
      order: input.order,
      orderBy: input.orderBy,
    });

    return {
      data: response.data,
      currentPage: response.currentPage,
      totalPages: response.totalPages,
    };
  }
}
