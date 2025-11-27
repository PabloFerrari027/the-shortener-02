import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';

type Input = { id: string };
type Output = void;

@Injectable()
export class DeleteShortUrlService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const shortUrl = await this.shortUrlRepository.findById(input.id);
    if (!shortUrl) throw new ShortUrlNotFoundError(input.id);
    await this.shortUrlRepository.delete(shortUrl.id);
  }
}
