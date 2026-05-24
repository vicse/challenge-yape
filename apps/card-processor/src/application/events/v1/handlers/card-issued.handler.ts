import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CardIssuedDomainEvent } from 'io/cards/domain/events/card-issued.event';
import { SharedProducer } from 'io/shared/infrastructure/kafka/producer/shared.producer';
import { TOPICS } from 'io/shared/utils/constants';

@Injectable()
@EventsHandler(CardIssuedDomainEvent)
export class CardIssuedHandler implements IEventHandler<CardIssuedDomainEvent> {
  private readonly logger = new Logger(CardIssuedHandler.name);

  constructor(private readonly sharedProducer: SharedProducer) {}

  async handle(event: CardIssuedDomainEvent): Promise<void> {
    const { card } = event;

    this.logger.log(`Publishing event to topic "${TOPICS.CARD_ISSUED}" for requestId: ${card.RequestId}`);

    await this.sharedProducer.publish(TOPICS.CARD_ISSUED, card.RequestId, {
      cardId: card.Id,
      requestId: card.RequestId,
      cardNumber: card.CardNumber,
      expirationDate: card.ExpirationDate,
      cvv: card.Cvv,
      status: card.Status,
    });
  }
}
