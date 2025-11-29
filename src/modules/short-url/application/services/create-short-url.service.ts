import type { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { Inject, Injectable } from '@nestjs/common';
import { ShortUrl } from '../../domain/entities/short-url.entity';
import { Bus } from '@/shared/domain-events/bus';
import type { UsersRepository } from '@/modules/users/domain/repositories/users.repository';
import { UserNotFoundError } from '@/modules/users/domain/errors/user-not-found.error';

type Input = { url: string; userId?: string };
type Output = { shortUrl: ShortUrl };

@Injectable()
export class CreateShortUrlService {
  constructor(
    @Inject('ShortUrlRepository')
    protected readonly shortUrlRepository: ShortUrlRepository,
    @Inject('UsersRepository')
    protected readonly usersRepository: UsersRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const userId = input.userId;

    if (userId) {
      const user = await this.usersRepository.findById(userId);
      if (!user) throw new UserNotFoundError(userId);
    }

    const count = await this.shortUrlRepository.count();
    const hash = ShortUrl.generateHash(count + 1);

    const shortUrl = ShortUrl.create({
      hash,
      url: input.url,
      userId,
    });

    await this.shortUrlRepository.create(shortUrl);
    await Bus.dispatch(shortUrl.pullEvents());

    return { shortUrl };
  }
}
