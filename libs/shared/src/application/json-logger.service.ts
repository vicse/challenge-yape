import { LoggerService } from '@nestjs/common';

export class JsonLoggerService implements LoggerService {
  log(message: string | Record<string, unknown>, context?: string): void {
    this.print('INFO', message, context);
  }

  warn(message: string | Record<string, unknown>, context?: string): void {
    this.print('WARN', message, context);
  }

  error(message: string | Record<string, unknown>, trace?: string, context?: string): void {
    this.print('ERROR', message, context, trace);
  }

  debug(message: string | Record<string, unknown>, context?: string): void {
    this.print('DEBUG', message, context);
  }

  private print(level: string, message: string | Record<string, unknown>, context?: string, trace?: string): void {
    const log: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? null,
    };

    if (typeof message === 'object' && message !== null) {
      Object.assign(log, message);
    } else {
      log.message = message;
    }

    if (trace) {
      log.trace = trace;
    }

    console.log(JSON.stringify(log));
  }
}
