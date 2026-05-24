import { Currency } from '../enums/currency.enum';
import { CardType } from '../enums/card-type.enum';

export interface ProductInfo {
  type: CardType;
  currency: Currency;
}
