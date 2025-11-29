import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { Bus } from '@/shared/domain-events/bus';

type Input = { url: string };
type Output = { shortUrl: ShortUrl };

@Injectable()
export class CreateShortUrlService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const count = await this.shortUrlRepository.count();
    const hash = ShortUrl.generateHash(count + 1);

    const shortUrl = ShortUrl.create({
      hash,
      url: input.url,
    });

    await this.shortUrlRepository.create(shortUrl);
    await Bus.dispatch(shortUrl.pullEvents());

    return { shortUrl };
  }
}
