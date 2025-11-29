import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { ShortUrlNotFoundError } from '../../domain/errors/short-url-not-found.error';
import { Bus } from '@/shared/domain-events/bus';
import { NotAllowedError } from '@/modules/auth/domain/erros/not-allowed.error';

type Input = { id: string; url: string; userId: string };
type Output = { shortUrl: ShortUrl };

@Injectable()
export class UpdateShortUrlService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const shortUrl = await this.shortUrlRepository.findById(input.id);

    if (!shortUrl) throw new ShortUrlNotFoundError(input.id);
    if (shortUrl.userId !== input.userId) throw new NotAllowedError();

    shortUrl.url = input.url;
    await this.shortUrlRepository.update(shortUrl);
    await Bus.dispatch(shortUrl.pullEvents());

    return { shortUrl };
  }
}
