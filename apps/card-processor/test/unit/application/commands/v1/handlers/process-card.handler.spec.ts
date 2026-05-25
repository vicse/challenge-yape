/* eslint-disable @typescript-eslint/unbound-method */
import { EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CardRepository } from 'io/cards/domain/repositories/card.repository';
import { CardStatus } from 'io/cards/domain/enums/card-status.enum';
import { Card } from 'io/cards/domain/entities/card.entity';
import { CardIssuedDomainEvent } from 'io/cards/domain/events/card-issued.event';
import { CardProcessingFailedDomainEvent } from 'io/cards/domain/events/card-processing-failed.event';
import { DocumentType } from 'io/cards/domain/enums/document-type.enum';
import { CardType } from 'io/cards/domain/enums/card-type.enum';
import { Currency } from 'io/cards/domain/enums/currency.enum';
import { ProcessCardHandler } from '../../../../../../src/application/commands/v1/handlers/process-card.handler';
import { ProcessCardCommand } from '../../../../../../src/application/commands/v1/process-card.command';

// Mock TimeUtils to avoid real delays in tests
jest.mock('io/shared/utils/time', () => ({
  TimeUtils: {
    delay: jest.fn().mockResolvedValue(undefined),
    getExponentialBackoffMs: jest.fn((attempt: number) => Math.pow(2, attempt - 1) * 1000),
    getRandomMs: jest.fn(() => 200),
  },
}));

describe('ProcessCardHandler', () => {
  let handler: ProcessCardHandler;
  let cardRepository: jest.Mocked<CardRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockCard = Card.create(
    'request-123',
    {
      documentType: DocumentType.DNI,
      documentNumber: '12345678',
      fullName: 'Juan Pérez',
      age: 25,
      email: 'juan@email.com',
    },
    {
      type: CardType.VISA,
      currency: Currency.PEN,
    },
  );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessCardHandler,
        {
          provide: CardRepository,
          useValue: {
            save: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn(),
            findByDocumentNumber: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: { publish: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(3) },
        },
      ],
    }).compile();

    handler = module.get(ProcessCardHandler);
    cardRepository = module.get(CardRepository);
    eventBus = module.get(EventBus);
  });

  it('should skip processing if card not found', async () => {
    cardRepository.findById.mockResolvedValue(null);

    const command = new ProcessCardCommand('card-123', 'request-123', false);
    await handler.execute(command);

    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should skip processing if card is not in PENDING status', async () => {
    const processingCard = Card.create('request-123', mockCard.Customer, mockCard.Product);
    processingCard.markAsProcessing();
    cardRepository.findById.mockResolvedValue(processingCard);

    const command = new ProcessCardCommand('card-123', 'request-123', false);
    await handler.execute(command);

    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should issue card successfully when no errors occur', async () => {
    cardRepository.findById.mockResolvedValue(mockCard);

    // Mock randomFailure to always succeed
    jest.spyOn(handler as any, 'randomFailure').mockReturnValue(false);

    const command = new ProcessCardCommand(mockCard.Id, 'request-123', false);
    await handler.execute(command);

    expect(mockCard.Status).toBe(CardStatus.ISSUED);
    expect(cardRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(CardIssuedDomainEvent));
  });

  it('should fail and publish to DLQ when forceError is true', async () => {
    const freshCard = Card.create('request-456', mockCard.Customer, mockCard.Product);
    cardRepository.findById.mockResolvedValue(freshCard);

    const command = new ProcessCardCommand(freshCard.Id, 'request-456', true);
    await handler.execute(command);

    expect(freshCard.Status).toBe(CardStatus.FAILED);
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(CardProcessingFailedDomainEvent));
  });

  it('should retry up to maxRetries before failing', async () => {
    const freshCard = Card.create('request-789', mockCard.Customer, mockCard.Product);
    cardRepository.findById.mockResolvedValue(freshCard);

    // Always fail
    jest.spyOn(handler as any, 'randomFailure').mockReturnValue(true);

    const command = new ProcessCardCommand(freshCard.Id, 'request-789', false);
    await handler.execute(command);

    expect(freshCard.Status).toBe(CardStatus.FAILED);
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ attempts: 3 }));
  });
});
