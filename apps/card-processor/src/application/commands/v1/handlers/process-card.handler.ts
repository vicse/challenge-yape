import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CardIssuedDomainEvent } from 'io/cards/domain/events/card-issued.event';
import { CardProcessingFailedDomainEvent } from 'io/cards/domain/events/card-processing-failed.event';
import { CardRepository } from 'io/cards/domain/repositories/card.repository';
import { CardStatus } from 'io/cards/domain/enums/card-status.enum';
import { CardGenerator } from 'io/shared/utils/card-generator';
import { ProcessCardCommand } from '../process-card.command';

@CommandHandler(ProcessCardCommand)
export class ProcessCardHandler implements ICommandHandler<ProcessCardCommand, void> {
  private readonly logger = new Logger(ProcessCardHandler.name);
  private readonly maxRetries: number;

  constructor(
    @Inject(CardRepository)
    private readonly cardRepository: CardRepository,
    private readonly eventBus: EventBus,
    private readonly configService: ConfigService,
  ) {
    this.maxRetries = this.configService.get<number>('MAX_RETRIES_PROCESS_CARD', 3);
  }

  async execute(command: ProcessCardCommand): Promise<void> {
    const { cardId, requestId, forceError } = command;

    this.logger.log({ message: 'Processing card request', correlationId: requestId, cardId });

    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      this.logger.error({ message: 'Card not found', correlationId: requestId, cardId });
      return;
    }

    if (card.Status !== CardStatus.PENDING) {
      this.logger.warn({
        message: 'Card already processed, skipping',
        correlationId: requestId,
        cardId,
        status: card.Status,
      });
      return;
    }

    card.markAsProcessing();
    await this.cardRepository.save(card);

    let attempts = 0;
    let success = false;

    while (attempts < this.maxRetries && !success) {
      attempts++;

      await this.simulateExternalLoad();

      const failed = forceError || this.randomFailure();

      if (!failed) {
        success = true;
      } else {
        this.logger.warn({
          message: 'Attempt failed',
          correlationId: requestId,
          attempt: attempts,
          maxRetries: this.maxRetries,
        });
      }
    }

    if (success) {
      const cardNumber = CardGenerator.generateCardNumber();
      const expirationDate = CardGenerator.generateExpirationDate();
      const cvv = CardGenerator.generateCvv();

      card.markAsIssued(cardNumber, expirationDate, cvv);
      await this.cardRepository.save(card);

      this.eventBus.publish(new CardIssuedDomainEvent(card));

      this.logger.log({ message: 'Card issued successfully', correlationId: requestId, cardId, attempts });
    } else {
      card.markAsFailed();
      await this.cardRepository.save(card);

      this.eventBus.publish(
        new CardProcessingFailedDomainEvent('Max retries exceeded', attempts, { cardId, requestId, forceError }),
      );

      this.logger.error({
        message: 'Card processing failed, sending to DLQ',
        correlationId: requestId,
        cardId,
        attempts,
      });
    }
  }

  private async simulateExternalLoad(): Promise<void> {
    const delay = Math.floor(Math.random() * 300) + 200;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private randomFailure(): boolean {
    return Math.random() < 0.3;
  }
}
