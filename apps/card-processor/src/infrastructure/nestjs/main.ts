import { NestFactory } from '@nestjs/core';
import { CardProcessorModule } from './card-processor.module';

async function bootstrap() {
  const app = await NestFactory.create(CardProcessorModule);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
void bootstrap();
