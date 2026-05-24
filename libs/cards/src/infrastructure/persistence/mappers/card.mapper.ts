import { Card } from '../../../domain/entities/card.entity';
import { CardOrmEntity } from '../entities/card.orm-entity';

import { CardStatus } from '../../../domain/enums/card-status.enum';
import { CardType } from '../../../domain/enums/card-type.enum';
import { Currency } from '../../../domain/enums/currency.enum';
import { DocumentType } from '../../../domain/enums/document-type.enum';

export class CardMapper {
  static toPersistence(card: Card): CardOrmEntity {
    const entity = new CardOrmEntity();

    entity.id = card.Id;
    entity.requestId = card.RequestId;

    entity.documentType = card.Customer.documentType;
    entity.documentNumber = card.Customer.documentNumber;
    entity.fullName = card.Customer.fullName;
    entity.age = card.Customer.age;
    entity.email = card.Customer.email;

    entity.cardType = card.Product.type;
    entity.currency = card.Product.currency;

    entity.status = card.Status;

    entity.cardNumber = card.CardNumber;
    entity.expirationDate = card.ExpirationDate;
    entity.cvv = card.Cvv;

    return entity;
  }

  static toDomain(entity: CardOrmEntity): Card {
    return Card.restore({
      id: entity.id,
      requestId: entity.requestId,
      customer: {
        documentType: entity.documentType as DocumentType,
        documentNumber: entity.documentNumber,
        fullName: entity.fullName,
        age: entity.age,
        email: entity.email,
      },
      product: {
        type: entity.cardType as CardType,
        currency: entity.currency as Currency,
      },
      status: entity.status as CardStatus,
      cardNumber: entity.cardNumber ?? undefined,
      expirationDate: entity.expirationDate ?? undefined,
      cvv: entity.cvv ?? undefined,
    });
  }
}
