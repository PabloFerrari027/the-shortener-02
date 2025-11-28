import { PaginationOptions } from 'src/shared/types/pagination-options.type';
import { ShortUrl, ShortUrlProps } from '../entities/short-url.entity';
import { ListingResponse } from 'src/shared/types/listing-response.type';

export interface ShortUrlRepository {
  create(shortUrl: ShortUrl): Promise<void>;
  findByHash(hash: string): Promise<ShortUrl | null>;
  findById(id: string): Promise<ShortUrl | null>;
  list(
    options?: PaginationOptions<keyof ShortUrlProps>,
  ): Promise<ListingResponse<ShortUrl>>;
  update(shortUrl: ShortUrl): Promise<void>;
  count(): Promise<number>;
  delete(id: string): Promise<void>;
}
