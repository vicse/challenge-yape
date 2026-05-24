import { Card } from '../entities/card.entity';

export abstract class CardRepository {
  abstract save(card: Card): Promise<void>;
  abstract findById(id: string): Promise<Card | null>;
  abstract findByDocumentNumber(documentNumber: string): Promise<Card | null>;
}
