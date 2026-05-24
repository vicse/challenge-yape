import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { SharedConsumer } from 'io/shared/infrastructure/kafka/consumer/shared.consumer';
import { TOPICS } from 'io/shared/utils/constants';
import { ProcessCardCommand } from '../../application/commands/v1/process-card.command';

interface CardRequestedData {
  cardId: string;
  requestId: string;
  forceError?: boolean;
  error?: Record<string, unknown>;
}

@Injectable()
export class CardRequestedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CardRequestedConsumer.name);
  private consumer: SharedConsumer;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.consumer = new SharedConsumer(
      this.configService,
      {
        topic: TOPICS.CARD_REQUESTED,
        groupId: 'card-processor-group',
        fromBeginning: this.configService.get<string>('KAFKA_FROM_BEGINNING', 'false') === 'true',
      },
      async ({ value }) => {
        const event = value as { data: CardRequestedData };
        const payload = event.data;

        if (payload.error) {
          this.logger.warn({
            message: 'Skipping failed card request',
            correlationId: payload.requestId,
            error: payload.error,
          });
          return;
        }

        this.logger.log({
          message: 'Message received, dispatching command',
          correlationId: payload.requestId,
          topic: TOPICS.CARD_REQUESTED,
        });

        const command = new ProcessCardCommand(payload.cardId, payload.requestId, payload.forceError ?? false);

        await this.commandBus.execute(command);
      },
    );

    await this.consumer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }
}
