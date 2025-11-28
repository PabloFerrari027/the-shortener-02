import { Env } from 'src/shared/env';
import { ShortUrl, ShortUrlJSON } from '../../domain/entities/short-url.entity';

export type ToControllerOut = ShortUrlJSON<'SNAKE_CASE'> & {
  short_url: string;
};

export type ToControllerListOut = {
  data: ToControllerOut[];
  total_pages: number;
  current_page?: number;
};

export class ShortUrlPresentation {
  static toController(shortUrl: ShortUrl): ToControllerOut;

  static toController(
    shortUrls: ShortUrl[],
    totalPages: number,
    currentPage: number,
  ): ToControllerListOut;

  static toController(
    input: ShortUrl | ShortUrl[],
    totalPages?: number,
    currentPage?: number,
  ): ToControllerOut | ToControllerListOut {
    if (Array.isArray(input)) {
      return {
        total_pages: totalPages!,
        current_page: currentPage!,
        data: input.map((shortUrl) => ({
          ...shortUrl.toJSON('SNAKE_CASE'),
          short_url: `${Env.APP_URL}/${shortUrl.hash}`,
        })),
      };
    }

    return {
      ...input.toJSON('SNAKE_CASE'),
      short_url: `${Env.APP_URL}/${input.hash}`,
    };
  }
}
