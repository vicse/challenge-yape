import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CardRepository } from '../../../domain/repositories/card.repository';
import { Card } from '../../../domain/entities/card.entity';

import { CardOrmEntity } from '../entities/card.orm-entity';
import { CardMapper } from '../mappers/card.mapper';

@Injectable()
export class TypeOrmCardRepository implements CardRepository {
  constructor(
    @InjectRepository(CardOrmEntity)
    private readonly repository: Repository<CardOrmEntity>,
  ) {}

  async save(card: Card): Promise<void> {
    const entity = CardMapper.toPersistence(card);

    await this.repository.save(entity);
  }

  async findById(id: string): Promise<Card | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? CardMapper.toDomain(entity) : null;
  }

  async findByDocumentNumber(documentNumber: string): Promise<Card | null> {
    const entity = await this.repository.findOne({
      where: { documentNumber },
    });

    return entity ? CardMapper.toDomain(entity) : null;
  }
}
