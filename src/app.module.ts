import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgShortUrlRepository } from './modules/short-url/infra/implementations/pg-short-url-repository.implementation';
import { ShortUrlModule } from './modules/short-url/short-url.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env',
    }),
    ShortUrlModule,
  ],
  providers: [
    {
      provide: 'ShortUrlRepository',
      useFactory() {
        return new PgShortUrlRepository();
      },
    },
  ],
  exports: ['ShortUrlRepository'],
})
export class AppModule {}
