import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';

export interface SharedConsumerConfig {
  topic: string;
  groupId: string;
  fromBeginning?: boolean;
}

export type MessageHandler = (payload: {
  key: string | null;
  value: unknown;
  headers: Record<string, string>;
}) => Promise<void>;

export class SharedConsumer {
  private readonly logger = new Logger(SharedConsumer.name);
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly config: SharedConsumerConfig,
    private readonly handler: MessageHandler,
  ) {}

  async connect(): Promise<void> {
    const kafka = new Kafka({
      clientId: this.configService.getOrThrow<string>('KAFKA_CLIENT_ID'),
      brokers: this.configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
    });

    this.consumer = kafka.consumer({ groupId: this.config.groupId });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.config.topic,
      fromBeginning: this.config.fromBeginning ?? false,
    });

    await this.consumer.run({
      eachMessage: async (messagePayload: EachMessagePayload) => {
        try {
          const { message } = messagePayload;
          const value = message.value?.toString();

          if (!value) return;

          const parsed = JSON.parse(value) as unknown;
          const key = message.key?.toString() ?? null;
          const headers: Record<string, string> = {};

          if (message.headers) {
            for (const [k, v] of Object.entries(message.headers)) {
              headers[k] = v?.toString() ?? '';
            }
          }

          await this.handler({ key, value: parsed, headers });
        } catch (error) {
          this.logger.error(`Error processing message from topic "${this.config.topic}"`, error);
        }
      },
    });

    this.logger.log(`Listening to topic: ${this.config.topic} (group: ${this.config.groupId})`);
  }

  async disconnect(): Promise<void> {
    await this.consumer?.disconnect();
  }
}
