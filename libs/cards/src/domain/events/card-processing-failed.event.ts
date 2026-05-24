import { IEvent } from '@nestjs/cqrs';

export interface CardProcessingFailedPayload {
  cardId: string;
  requestId: string;
  forceError: boolean;
}

export class CardProcessingFailedDomainEvent implements IEvent {
  constructor(
    public readonly reason: string,
    public readonly attempts: number,
    public readonly originalPayload: CardProcessingFailedPayload,
  ) {}
}
