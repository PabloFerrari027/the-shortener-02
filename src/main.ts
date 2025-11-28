import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Env } from './shared/env';
import { GlobalExceptionFilter } from './shared/infra/http/filter/global-exeption.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
    },
  });

  await app.listen(Env.PORT);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
