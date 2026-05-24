import { CustomerInfo } from 'io/cards/domain/value-objects/customer-info.vo';
import { ProductInfo } from 'io/cards/domain/value-objects/product-info.vo';

export class IssueCardCommand {
  constructor(
    public readonly customer: CustomerInfo,
    public readonly product: ProductInfo,
    public readonly forceError: boolean,
  ) {}
}
