import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';
import { CardType } from 'io/cards/domain/enums/card-type.enum';
import { Currency } from 'io/cards/domain/enums/currency.enum';
import { DocumentType } from 'io/cards/domain/enums/document-type.enum';

export class CustomerInfoDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentNumber: string;

  @IsString()
  fullName: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsEmail()
  email: string;
}

export class ProductInfoDto {
  @IsEnum(CardType)
  type: CardType;

  @IsEnum(Currency)
  currency: Currency;
}

export class IssueCardRequest {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProductInfoDto)
  product: ProductInfoDto;

  @IsBoolean()
  forceError: boolean;
}
