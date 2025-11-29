import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgShortUrlRepository } from './modules/short-url/infra/repositories/pg-short-url.repository';
import { ShortUrlModule } from './modules/short-url/short-url.module';
import { AuthModule } from './modules/auth/auth.modules';
import { PgCodeValidationRepository } from './modules/auth/infra/repositories/pg-code-validation.repository';
import { PgSessionsRepository } from './modules/auth/infra/repositories/pg-sessions.repository';
import { PgUsersRepository } from './modules/users/infra/repositories/pg-users.repository';
import { JWTEncodingAdapter } from './shared/infra/adapters/jwt-encoding.adapter';
import { BcrtiptHasherAdapter } from './shared/infra/adapters/bcript-hasher.adapter';
import { InMemoryNotificationAdapter } from './shared/infra/adapters/in-memory-notification.adapter';
import { BullQueueAdapter } from './shared/infra/adapters/bull-queue.adapter';
import { VerificationCodeTemplate } from './modules/auth/templates/verification-code.template';
import { DomainEventsManager } from './shared/infra/managers/domain-events.manager';
import { SessionCreatedHandler } from './modules/auth/application/handlers/events/session-created.handler';
import { UsersModule } from './modules/users/users.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test.local' : '.env',
    }),
    ShortUrlModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    SessionCreatedHandler,
    DomainEventsManager,
    {
      provide: 'ShortUrlRepository',
      useFactory() {
        return new PgShortUrlRepository();
      },
    },
    {
      provide: 'CodeValidationRepository',
      useFactory() {
        return new PgCodeValidationRepository();
      },
    },
    {
      provide: 'SessionsRepository',
      useFactory() {
        return new PgSessionsRepository();
      },
    },
    {
      provide: 'UsersRepository',
      useFactory() {
        return new PgUsersRepository();
      },
    },
    {
      provide: 'EncodingPort',
      useFactory() {
        return new JWTEncodingAdapter();
      },
    },
    {
      provide: 'HasherPort',
      useFactory() {
        return new BcrtiptHasherAdapter();
      },
    },
    {
      provide: 'NotificationPort',
      useFactory() {
        return new InMemoryNotificationAdapter();
      },
    },
    {
      provide: 'QueuePort',
      useFactory() {
        return new BullQueueAdapter();
      },
    },
    {
      provide: 'VerificationCodeTemplate',
      useFactory() {
        return new VerificationCodeTemplate();
      },
    },
  ],
  exports: [
    'ShortUrlRepository',
    'CodeValidationRepository',
    'SessionsRepository',
    'UsersRepository',
    'EncodingPort',
    'HasherPort',
    'NotificationPort',
    'QueuePort',
    'VerificationCodeTemplate',
  ],
})
export class AppModule {}
