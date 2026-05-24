import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CardRequestAlreadyExistsException } from '../../../domain/exceptions/card-request-already-exists.exception';

const DOMAIN_EXCEPTION_STATUS_MAP = new Map<string, number>([
  [CardRequestAlreadyExistsException.name, HttpStatus.CONFLICT],
]);

@Catch(CardRequestAlreadyExistsException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = DOMAIN_EXCEPTION_STATUS_MAP.get(exception.name) ?? HttpStatus.UNPROCESSABLE_ENTITY;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
