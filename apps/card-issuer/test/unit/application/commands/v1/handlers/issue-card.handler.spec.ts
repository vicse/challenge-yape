/* eslint-disable @typescript-eslint/unbound-method */
import { EventBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { CardRepository } from 'io/cards/domain/repositories/card.repository';
import { CardStatus } from 'io/cards/domain/enums/card-status.enum';
import { CardRequestedDomainEvent } from 'io/cards/domain/events/card-requested.event';
import { DocumentType } from 'io/cards/domain/enums/document-type.enum';
import { CardType } from 'io/cards/domain/enums/card-type.enum';
import { Currency } from 'io/cards/domain/enums/currency.enum';
import { Card } from 'io/cards/domain/entities/card.entity';
import { IssueCardHandler } from '../../../../../../src/application/commands/v1/handlers/issue-card.handler';
import { IssueCardCommand } from '../../../../../../src/application/commands/v1/issue-card.command';
import { CardRequestAlreadyExistsException } from '../../../../../../src/domain/exceptions/card-request-already-exists.exception';

describe('IssueCardHandler', () => {
  let handler: IssueCardHandler;
  let cardRepository: jest.Mocked<CardRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockCustomer = {
    documentType: DocumentType.DNI,
    documentNumber: '12345678',
    fullName: 'Juan Pérez',
    age: 25,
    email: 'juan@email.com',
  };

  const mockProduct = {
    type: CardType.VISA,
    currency: Currency.PEN,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IssueCardHandler,
        {
          provide: CardRepository,
          useValue: {
            save: jest.fn().mockResolvedValue(undefined),
            findById: jest.fn().mockResolvedValue(null),
            findByDocumentNumber: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(IssueCardHandler);
    cardRepository = module.get(CardRepository);
    eventBus = module.get(EventBus);
  });

  it('should create a card request and publish event', async () => {
    const command = new IssueCardCommand(mockCustomer, mockProduct, false);
    const result = await handler.execute(command);

    expect(result.requestId).toBeDefined();
    expect(result.status).toBe(CardStatus.PENDING);
    expect(cardRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(CardRequestedDomainEvent));
  });

  it('should throw CardRequestAlreadyExistsException if document number exists', async () => {
    const existingCard = Card.create('existing-request', mockCustomer, mockProduct);
    cardRepository.findByDocumentNumber.mockResolvedValue(existingCard);

    const command = new IssueCardCommand(mockCustomer, mockProduct, false);

    await expect(handler.execute(command)).rejects.toThrow(CardRequestAlreadyExistsException);
    expect(cardRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should pass forceError flag in the domain event', async () => {
    const command = new IssueCardCommand(mockCustomer, mockProduct, true);
    await handler.execute(command);

    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ forceError: true }));
  });
});
