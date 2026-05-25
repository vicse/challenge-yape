import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CardIssuerModule } from './card-issuer.module';
import { DomainExceptionFilter } from './filters/domain-exception.filter';
import { JsonLoggerService } from 'io/shared/application/json-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(CardIssuerModule);

  app.useGlobalFilters(new DomainExceptionFilter());

  app.useLogger(new JsonLoggerService());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.ISSUER_PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();
