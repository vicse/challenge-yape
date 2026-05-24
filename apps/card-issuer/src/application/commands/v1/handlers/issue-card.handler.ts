import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CardRequestedDomainEvent } from 'io/cards/domain/events/card-requested.event';
import { Card } from 'io/cards/domain/entities/card.entity';
import { CardRepository } from 'io/cards/domain/repositories/card.repository';
import { CardRequestAlreadyExistsException } from '../../../../domain/exceptions/card-request-already-exists.exception';
import { IssueCardCommand } from '../issue-card.command';
import { IssueCardResult } from '../issue-card.result';

@CommandHandler(IssueCardCommand)
export class IssueCardHandler implements ICommandHandler<IssueCardCommand, IssueCardResult> {
  constructor(
    @Inject(CardRepository)
    private readonly cardRepository: CardRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: IssueCardCommand): Promise<IssueCardResult> {
    const existing = await this.cardRepository.findByDocumentNumber(command.customer.documentNumber);

    if (existing) {
      throw new CardRequestAlreadyExistsException(command.customer.documentNumber);
    }

    const requestId = crypto.randomUUID();

    const card = Card.create(requestId, command.customer, command.product);

    await this.cardRepository.save(card);

    this.eventBus.publish(new CardRequestedDomainEvent(card, command.forceError));

    return {
      requestId: card.RequestId,
      status: card.Status,
    };
  }
}
