import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';

export function createKafkaClient(configService: ConfigService): Kafka {
  return new Kafka({
    clientId: configService.getOrThrow<string>('KAFKA_CLIENT_ID'),
    brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
  });
}
