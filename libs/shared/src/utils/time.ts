export class TimeUtils {
  static async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  static getExponentialBackoffMs(attempt: number): number {
    return Math.pow(2, attempt - 1) * 1000;
  }

  static getRandomMs(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
