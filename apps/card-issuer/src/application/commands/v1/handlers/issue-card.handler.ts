import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Card } from 'io/cards/domain/entities/card.entity';
import { CardRepository } from 'io/cards/domain/repositories/card.repository';
import { IssueCardCommand } from '../../issue-card.command';
import { IssueCardResult } from '../issue-card.result';
import { CardRequestAlreadyExistsException } from 'apps/card-issuer/src/domain/exceptions/card-request-already-exists.exception';

@CommandHandler(IssueCardCommand)
export class IssueCardHandler implements ICommandHandler<IssueCardCommand, IssueCardResult> {
  constructor(
    @Inject(CardRepository)
    private readonly cardRepository: CardRepository,
  ) {}

  async execute(command: IssueCardCommand): Promise<IssueCardResult> {
    const existing = await this.cardRepository.findByDocumentNumber(command.customer.documentNumber);

    if (existing) throw new CardRequestAlreadyExistsException(command.customer.documentNumber);

    const requestId = crypto.randomUUID();

    const card = Card.create(requestId, command.customer, command.product);

    if (command.forceError) {
      card.markAsFailed();
    }

    await this.cardRepository.save(card);

    return {
      requestId: card.RequestId,
      status: card.Status,
    };
  }
}
