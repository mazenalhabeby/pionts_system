import {
  Controller, Post, Body, UseGuards, HttpException, Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SecretKeyGuard } from '../common/guards/secret-key.guard';
import { SecretKeyProject } from '../common/decorators/secret-key-project.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('api/v1/webhooks')
@UseGuards(SecretKeyGuard)
@Throttle({ default: { ttl: 60000, limit: 300 } })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('order')
  async orderCreated(
    @SecretKeyProject() project: { id: number },
    @Body() body: any,
  ) {
    try {
      return await this.webhooksService.processOrder(project.id, body);
    } catch (err) {
      if (!(err instanceof HttpException)) this.logger.error('Order webhook error:', err);
      throw err;
    }
  }

  @Post('customer')
  async customerCreated(
    @SecretKeyProject() project: { id: number },
    @Body() body: any,
  ) {
    try {
      return await this.webhooksService.processCustomer(project.id, body);
    } catch (err) {
      if (!(err instanceof HttpException)) this.logger.error('Customer webhook error:', err);
      throw err;
    }
  }

  @Post('refund')
  async refundCreated(
    @SecretKeyProject() project: { id: number },
    @Body() body: any,
  ) {
    try {
      return await this.webhooksService.processRefund(project.id, body);
    } catch (err) {
      if (!(err instanceof HttpException)) this.logger.error('Refund webhook error:', err);
      throw err;
    }
  }
}
