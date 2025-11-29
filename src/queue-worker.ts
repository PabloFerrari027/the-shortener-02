import { NestFactory } from '@nestjs/core';
import { QueueModule } from './queue.module';

async function bootstrap() {
  const app = await NestFactory.create(QueueModule);
  await app.init();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
