import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiKeyService } from '../auth/api-key.service';
import { WebhooksService } from './webhooks.service';

class OrderPaidDto {
  @IsString() @IsNotEmpty() orderId: string;
  @IsString() @IsNotEmpty() email: string;
  @IsString() @IsOptional() customerName?: string;
  @IsNumber() orderTotal: number;
  @IsString() @IsOptional() currency?: string;
  @IsString() @IsOptional() referralCode?: string;
}

class OrderRefundedDto {
  @IsString() @IsNotEmpty() orderId: string;
  @IsNumber() @IsOptional() refundAmount?: number;
}

@Controller('api/v1/webhooks')
@Throttle({ default: { ttl: 60000, limit: 300 } })
export class GenericWebhookController {
  private readonly logger = new Logger(GenericWebhookController.name);

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhooksService: WebhooksService,
  ) {}

  private async resolveProject(apiKey: string | undefined): Promise<{ id: number }> {
    if (!apiKey) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const project = await this.apiKeyService.validateKey(apiKey, 'secret');
    if (!project) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    return project;
  }

  @Post('order-paid')
  async orderPaid(
    @Headers('x-api-key') apiKey: string | undefined,
    @Body() body: OrderPaidDto,
  ) {
    const project = await this.resolveProject(apiKey);

    try {
      return await this.webhooksService.processOrder(project.id, {
        customer_email: body.email,
        customer_name: body.customerName,
        order_id: body.orderId,
        order_total: body.orderTotal,
        referral_code: body.referralCode,
      });
    } catch (err) {
      if (!(err instanceof HttpException)) this.logger.error('Order-paid webhook error:', err);
      throw err;
    }
  }

  @Post('order-refunded')
  async orderRefunded(
    @Headers('x-api-key') apiKey: string | undefined,
    @Body() body: OrderRefundedDto,
  ) {
    const project = await this.resolveProject(apiKey);

    try {
      return await this.webhooksService.processRefund(project.id, {
        order_id: body.orderId,
      });
    } catch (err) {
      if (!(err instanceof HttpException)) this.logger.error('Order-refunded webhook error:', err);
      throw err;
    }
  }
}
