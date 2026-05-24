import { DocumentType } from '../enums/document-type.enum';

export interface CustomerInfo {
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
}
