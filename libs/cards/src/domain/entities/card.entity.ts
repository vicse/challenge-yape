import { CardStatus } from '../enums/card-status.enum';
import { CustomerInfo } from '../value-objects/customer-info.vo';
import { ProductInfo } from '../value-objects/product-info.vo';

export interface CardProps {
  id: string;
  requestId: string;

  customer: CustomerInfo;
  product: ProductInfo;
  status: CardStatus;

  cardNumber?: string;
  expirationDate?: string;
  cvv?: string;
}

export class Card {
  constructor(private readonly props: CardProps) {}

  static create(requestId: string, customer: CustomerInfo, product: ProductInfo): Card {
    return new Card({
      id: crypto.randomUUID(),
      requestId,
      customer,
      product,
      status: CardStatus.PENDING,
    });
  }

  markAsProcessing(): void {
    this.props.status = CardStatus.PROCESSING;
  }

  markAsIssued(cardNumber: string, expirationDate: string, cvv: string): void {
    this.props.status = CardStatus.ISSUED;
    this.props.cardNumber = cardNumber;
    this.props.expirationDate = expirationDate;
    this.props.cvv = cvv;
  }

  markAsFailed(): void {
    this.props.status = CardStatus.FAILED;
  }

  get Id(): string {
    return this.props.id;
  }

  get RequestId(): string {
    return this.props.requestId;
  }

  get Customer(): CustomerInfo {
    return this.props.customer;
  }

  get Product(): ProductInfo {
    return this.props.product;
  }

  get Status(): CardStatus {
    return this.props.status;
  }

  get CardNumber(): string | undefined {
    return this.props.cardNumber;
  }

  get ExpirationDate(): string | undefined {
    return this.props.expirationDate;
  }

  get Cvv(): string | undefined {
    return this.props.cvv;
  }

  static restore(props: CardProps): Card {
    return new Card(props);
  }
}
