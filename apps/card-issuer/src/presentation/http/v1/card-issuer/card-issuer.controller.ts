import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { IssueCardCommand } from '../../../../application/commands/issue-card.command';
import { IssueCardResult } from '../../../../application/commands/v1/issue-card.result';
import { IssueCardRequest } from './dto/card-issuer.request';

@Controller('v1/cards')
export class CardIssuerController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  async issue(@Body() request: IssueCardRequest): Promise<IssueCardResult> {
    return this.commandBus.execute(new IssueCardCommand(request.customer, request.product, request.forceError));
  }
}
