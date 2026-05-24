import { IEvent } from '@nestjs/cqrs';
import { Card } from '../entities/card.entity';

export class CardRequestedDomainEvent implements IEvent {
  constructor(
    public readonly card: Card,
    public readonly forceError: boolean = false,
  ) {}
}
