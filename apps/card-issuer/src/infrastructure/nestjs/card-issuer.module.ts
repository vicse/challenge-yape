import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsModule } from 'io/cards/infrastructure/nestjs/cards.module';
import { getDatabaseConfig } from 'io/cards/infrastructure/persistence/config/database.config';
import { SharedModule } from 'io/shared/infrastructure/nestjs/shared.module';
import { IssueCardHandler } from '../../application/commands/v1/handlers/issue-card.handler';
import { CardRequestedHandler } from '../../application/events/v1/handlers/card-requested.handler';
import { CardIssuerController } from '../../presentation/http/v1/card-issuer/card-issuer.controller';
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
  controllers: [CardIssuerController, HealthCheckController],
  providers: [IssueCardHandler, CardRequestedHandler],
})
export class CardIssuerModule {}
