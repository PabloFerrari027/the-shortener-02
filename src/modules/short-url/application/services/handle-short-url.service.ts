import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { Bus } from '@/shared/domain-events/bus';

type Input = { hash: string };
type Output = { shortUrl: ShortUrl };

@Injectable()
export class HandleShortUrlService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const shortUrl = await this.shortUrlRepository.findByHash(input.hash);

    if (!shortUrl) throw new ShortUrlNotFoundError(input.hash);

    shortUrl.incrementClickCount();
    await this.shortUrlRepository.update(shortUrl);
    await Bus.dispatch(shortUrl.pullEvents());

    return { shortUrl };
  }
}
