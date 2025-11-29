import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import {
  ShortUrl,
  ShortUrlProps,
} from '../../domain/entities/short-url.entity';
import { Order } from 'src/shared/types/pagination-options.type';

type Input = { page: number; orderBy?: keyof ShortUrlProps; order?: Order };
type Output = {
  data: Array<ShortUrl>;
  totalPages: number;
  currentPage: number;
};

@Injectable()
export class ListShortnerUrlsService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const response = await this.shortUrlRepository.list({
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
