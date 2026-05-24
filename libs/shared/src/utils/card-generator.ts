export class CardGenerator {
  static generateCardNumber(): string {
    const prefix = '4';
    const digits = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
    return prefix + digits;
  }

  static generateExpirationDate(): string {
    const now = new Date();
    const year = now.getFullYear() + Math.floor(Math.random() * 5) + 1;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return `${month}/${year}`;
  }

  static generateCvv(): string {
    return String(Math.floor(Math.random() * 900) + 100);
  }
}
