/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import request from 'supertest';
import { CardRepository } from 'io/cards/domain/repositories/card.repository';
import { Card } from 'io/cards/domain/entities/card.entity';
import { DocumentType } from 'io/cards/domain/enums/document-type.enum';
import { CardType } from 'io/cards/domain/enums/card-type.enum';
import { Currency } from 'io/cards/domain/enums/currency.enum';
import { CardIssuerController } from '../../src/presentation/http/v1/card-issuer/card-issuer.controller';
import { IssueCardHandler } from '../../src/application/commands/v1/handlers/issue-card.handler';
import { DomainExceptionFilter } from '../../src/infrastructure/nestjs/filters/domain-exception.filter';

describe('Card Issuer (e2e)', () => {
  let app: INestApplication;
  let cardRepository: jest.Mocked<CardRepository>;

  const validPayload = {
    customer: {
      documentType: 'DNI',
      documentNumber: '12345678',
      fullName: 'Juan Pérez',
      age: 25,
      email: 'juan@email.com',
    },
    product: {
      type: 'VISA',
      currency: 'PEN',
    },
    forceError: false,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule],
      controllers: [CardIssuerController],
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
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    cardRepository = module.get(CardRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/cards/issue', () => {
    it('should return 201 with requestId and PENDING status', async () => {
      const response = await request(app.getHttpServer()).post('/v1/cards/issue').send(validPayload).expect(201);

      expect(response.body).toHaveProperty('requestId');
      expect(response.body.status).toBe('PENDING');
    });

    it('should return 409 when document number already exists', async () => {
      const existingCard = Card.create(
        'existing',
        {
          documentType: DocumentType.DNI,
          documentNumber: '12345678',
          fullName: 'Existing',
          age: 30,
          email: 'existing@test.com',
        },
        { type: CardType.VISA, currency: Currency.PEN },
      );
      cardRepository.findByDocumentNumber.mockResolvedValueOnce(existingCard);

      const response = await request(app.getHttpServer()).post('/v1/cards/issue').send(validPayload).expect(409);

      expect(response.body.error).toBe('CardRequestAlreadyExistsException');
    });

    it('should return 400 when customer is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/cards/issue')
        .send({ product: validPayload.product, forceError: false })
        .expect(400);
    });

    it('should return 400 when product is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/cards/issue')
        .send({ customer: validPayload.customer, forceError: false })
        .expect(400);
    });

    it('should return 400 when email is invalid', async () => {
      const payload = {
        ...validPayload,
        customer: { ...validPayload.customer, email: 'not-an-email' },
      };

      await request(app.getHttpServer()).post('/v1/cards/issue').send(payload).expect(400);
    });

    it('should return 400 when documentType is invalid', async () => {
      const payload = {
        ...validPayload,
        customer: { ...validPayload.customer, documentType: 'INVALID' },
      };

      await request(app.getHttpServer()).post('/v1/cards/issue').send(payload).expect(400);
    });

    it('should return 400 when forceError is missing', async () => {
      const payload = { customer: validPayload.customer, product: validPayload.product };

      await request(app.getHttpServer()).post('/v1/cards/issue').send(payload).expect(400);
    });
  });
});
