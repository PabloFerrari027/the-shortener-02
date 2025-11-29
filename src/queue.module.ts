import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendCodeValidationHandler } from './modules/auth/application/handlers/queues/send-code-validation.handler';
import { QueueManager } from './shared/infra/managers/queue.manager';
import { VerificationCodeTemplate } from './modules/auth/templates/verification-code.template';
import { PgCodeValidationRepository } from './modules/auth/infra/repositories/pg-code-validation.repository';
import { PgSessionsRepository } from './modules/auth/infra/repositories/pg-sessions.repository';
import { PgShortUrlRepository } from './modules/short-url/infra/repositories/pg-short-url.repository';
import { PgUsersRepository } from './modules/users/infra/repositories/pg-users.repository';
import { BcrtiptHasherAdapter } from './shared/infra/adapters/bcript-hasher.adapter';
import { BullQueueAdapter } from './shared/infra/adapters/bull-queue.adapter';
import { InMemoryNotificationAdapter } from './shared/infra/adapters/in-memory-notification.adapter';
import { JWTEncodingAdapter } from './shared/infra/adapters/jwt-encoding.adapter';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    SendCodeValidationHandler,
    QueueManager,
    {
      provide: 'VerificationCodeTemplate',
      useFactory() {
        return new VerificationCodeTemplate();
      },
    },
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
  ],
  exports: [
    'VerificationCodeTemplate',
    'ShortUrlRepository',
    'CodeValidationRepository',
    'SessionsRepository',
    'UsersRepository',
    'EncodingPort',
    'HasherPort',
    'NotificationPort',
    'QueuePort',
  ],
})
export class QueueModule {}
