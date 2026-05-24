import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CardProcessingFailedDomainEvent } from 'io/cards/domain/events/card-processing-failed.event';
import { SharedProducer } from 'io/shared/infrastructure/kafka/producer/shared.producer';
import { TOPICS } from 'io/shared/utils/constants';

@Injectable()
@EventsHandler(CardProcessingFailedDomainEvent)
export class CardProcessingFailedHandler implements IEventHandler<CardProcessingFailedDomainEvent> {
  private readonly logger = new Logger(CardProcessingFailedHandler.name);

  constructor(private readonly sharedProducer: SharedProducer) {}

  async handle(event: CardProcessingFailedDomainEvent): Promise<void> {
    const { reason, attempts, originalPayload } = event;

    this.logger.log({
      message: 'Publishing event to DLQ',
      correlationId: originalPayload.requestId,
      topic: TOPICS.CARD_REQUESTED_DLQ,
      reason,
      attempts,
    });

    await this.sharedProducer.publish(TOPICS.CARD_REQUESTED_DLQ, originalPayload.requestId, {
      reason,
      attempts,
      originalPayload,
    });
  }
}
