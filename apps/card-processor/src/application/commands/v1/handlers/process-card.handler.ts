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

    this.logger.log(`Processing card request: ${requestId}`);

    const card = await this.cardRepository.findById(cardId);

    if (!card) {
      this.logger.error(`Card not found: ${cardId}`);
      return;
    }

    if (card.Status !== CardStatus.PENDING) {
      this.logger.warn(`Card ${cardId} is already in status ${card.Status}, skipping`);
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
        this.logger.warn(`Attempt ${attempts}/${this.maxRetries} failed for requestId: ${requestId}`);
      }
    }

    if (success) {
      const cardNumber = CardGenerator.generateCardNumber();
      const expirationDate = CardGenerator.generateExpirationDate();
      const cvv = CardGenerator.generateCvv();

      card.markAsIssued(cardNumber, expirationDate, cvv);
      await this.cardRepository.save(card);

      this.eventBus.publish(new CardIssuedDomainEvent(card));

      this.logger.log(`Card issued successfully for requestId: ${requestId}`);
    } else {
      card.markAsFailed();
      await this.cardRepository.save(card);

      this.eventBus.publish(
        new CardProcessingFailedDomainEvent('Max retries exceeded', attempts, { cardId, requestId, forceError }),
      );

      this.logger.error(`Card processing failed after ${attempts} retries for requestId: ${requestId}`);
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
