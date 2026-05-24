export class CardRequestAlreadyExistsException extends Error {
  constructor(documentNumber: string) {
    super(`A card request already exists for document number: ${documentNumber}`);
    this.name = 'CardRequestAlreadyExistsException';
  }
}
