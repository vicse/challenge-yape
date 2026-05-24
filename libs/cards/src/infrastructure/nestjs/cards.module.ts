import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardRepository } from '../../domain/repositories/card.repository';
import { CardOrmEntity } from '../persistence/entities/card.orm-entity';
import { TypeOrmCardRepository } from '../persistence/repositories/typeorm-card.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CardOrmEntity])],
  providers: [
    {
      provide: CardRepository,
      useClass: TypeOrmCardRepository,
    },
  ],
  exports: [CardRepository],
})
export class CardsModule {}
