import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import {
  ShortUrl,
  ShortUrlProps,
} from '../../domain/entities/short-url.entity';
import { Order } from 'src/shared/types/pagination-options.type';

type Input = {
  userId: string;
  page: number;
  orderBy?: keyof ShortUrlProps;
  order?: Order;
};
type Output = {
  data: Array<ShortUrl>;
  totalPages: number;
  currentPage: number;
};

@Injectable()
export class ListShortnerUrlsByUserService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const response = await this.shortUrlRepository.listByUserId(input.userId, {
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
