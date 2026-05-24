import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Partitioners, Producer } from 'kafkajs';
import { SharedProducer } from './producer/shared.producer';

@Global()
@Module({
  providers: [
    {
      provide: 'KAFKA_PRODUCER',
      useFactory: async (configService: ConfigService): Promise<Producer> => {
        const brokers = configService.getOrThrow<string>('KAFKA_BROKERS').split(',');
        const clientId = configService.getOrThrow<string>('KAFKA_CLIENT_ID');

        const kafka = new Kafka({ clientId, brokers });

        const producer = kafka.producer({
          createPartitioner: Partitioners.LegacyPartitioner,
          allowAutoTopicCreation: true,
        });

        await producer.connect();

        return producer;
      },
      inject: [ConfigService],
    },
    SharedProducer,
  ],
  exports: [SharedProducer],
})
export class KafkaModule {}
