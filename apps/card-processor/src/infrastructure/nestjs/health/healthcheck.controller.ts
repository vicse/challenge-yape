import { Controller, Get } from '@nestjs/common';

@Controller('healthcheck')
export class HealthCheckController {
  @Get()
  healthCheck() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }
}
