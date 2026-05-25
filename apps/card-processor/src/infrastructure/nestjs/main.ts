import { NestFactory } from '@nestjs/core';
import { CardProcessorModule } from './card-processor.module';
import { JsonLoggerService } from 'io/shared/application/json-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(CardProcessorModule);

  app.useLogger(new JsonLoggerService());

  const port = process.env.PROCESSOR_PORT ?? 3001;
  await app.listen(port);
}
void bootstrap();
