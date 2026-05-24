import { Global, Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';

@Global()
@Module({
  imports: [KafkaModule],
  exports: [KafkaModule],
})
export class SharedModule {}
