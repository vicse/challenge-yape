import { IEvent } from '@nestjs/cqrs';
import { Card } from '../entities/card.entity';

export class CardIssuedDomainEvent implements IEvent {
  constructor(public readonly card: Card) {}
}
