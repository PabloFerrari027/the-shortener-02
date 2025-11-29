import { Module } from '@nestjs/common';
import { ShortUrlController } from './application/short-url.controller';
import { CreateShortUrlService } from './application/services/create-short-url.service';
import { HandleShortUrlService } from './application/services/handle-short-url.service';
import { ListShortnerUrlsService } from './application/services/list-shortner-urls.service';
import { UpdateShortUrlService } from './application/services/update-short-url.service';
import { DeleteShortUrlService } from './application/services/delete-short-url.service';

@Module({
  controllers: [ShortUrlController],
  providers: [
    CreateShortUrlService,
    HandleShortUrlService,
    ListShortnerUrlsService,
    CreateShortUrlService,
    UpdateShortUrlService,
    DeleteShortUrlService,
  ],
})
export class ShortUrlModule {}
