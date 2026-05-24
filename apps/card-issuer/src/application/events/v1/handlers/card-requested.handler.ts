import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CardRequestedDomainEvent } from 'io/cards/domain/events/card-requested.event';
import { SharedProducer } from 'io/shared/infrastructure/kafka/producer/shared.producer';
import { TOPICS } from 'io/shared/utils/constants';

@Injectable()
@EventsHandler(CardRequestedDomainEvent)
export class CardRequestedHandler implements IEventHandler<CardRequestedDomainEvent> {
  private readonly logger = new Logger(CardRequestedHandler.name);

  constructor(private readonly sharedProducer: SharedProducer) {}

  async handle(event: CardRequestedDomainEvent): Promise<void> {
    const { card, forceError } = event;

    this.logger.log({
      message: 'Publishing event',
      correlationId: card.RequestId,
      topic: TOPICS.CARD_REQUESTED,
      forceError,
    });

    await this.sharedProducer.publish(TOPICS.CARD_REQUESTED, card.RequestId, {
      cardId: card.Id,
      requestId: card.RequestId,
      customer: card.Customer,
      product: card.Product,
      status: card.Status,
      forceError,
    });
  }
}
