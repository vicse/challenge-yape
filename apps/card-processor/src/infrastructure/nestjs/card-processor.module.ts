import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsModule } from 'io/cards/infrastructure/nestjs/cards.module';
import { getDatabaseConfig } from 'io/cards/infrastructure/persistence/config/database.config';
import { SharedModule } from 'io/shared/infrastructure/nestjs/shared.module';
import { ProcessCardHandler } from '../../application/commands/v1/handlers/process-card.handler';
import { CardRequestedConsumer } from '../kafka/card-requested.consumer';
import { CardIssuedHandler } from '../../application/events/v1/handlers/card-issued.handler';
import { CardProcessingFailedHandler } from '../../application/events/v1/handlers/card-processing-failed.handler';
import { HealthCheckController } from './health/healthcheck.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
    }),
    CqrsModule,
    SharedModule,
    CardsModule,
  ],
  controllers: [HealthCheckController],
  providers: [ProcessCardHandler, CardRequestedConsumer, CardIssuedHandler, CardProcessingFailedHandler],
})
export class CardProcessorModule {}
