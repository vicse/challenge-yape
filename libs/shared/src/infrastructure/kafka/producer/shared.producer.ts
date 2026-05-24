import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Producer } from 'kafkajs';
import { CloudEvent } from '../../../domain/events/cloud-event';

@Injectable()
export class SharedProducer {
  private readonly logger = new Logger(SharedProducer.name);
  private eventCounter = 0;

  constructor(
    @Inject('KAFKA_PRODUCER')
    private readonly producer: Producer,
  ) {}

  async publish<T>(topic: string, source: string, data: T): Promise<void> {
    this.eventCounter++;

    const event: CloudEvent<T> = {
      id: this.eventCounter,
      source,
      type: topic,
      data,
    };

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: source,
            value: JSON.stringify(event),
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to publish event to topic "${topic}"`, error);
      throw error;
    }
  }
}
