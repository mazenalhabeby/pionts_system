import {
  Controller, Post, Body, Req, UseGuards, Logger, Headers,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { ShopifyWebhookHmacGuard } from './guards/shopify-hmac.guard';
import { ShopifyWebhookService } from './shopify-webhook.service';

@Controller('shopify/webhooks')
@UseGuards(ShopifyWebhookHmacGuard)
@SkipThrottle()
export class ShopifyWebhookController {
  private readonly logger = new Logger(ShopifyWebhookController.name);

  @Post('orders-create')
  async orderCreated(
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() body: any,
  ) {
    if (!shopDomain) {
      this.logger.warn('Missing X-Shopify-Shop-Domain header');
      return { status: 'ignored' };
    }

    try {
      return await this.shopifyWebhookService.handleOrderCreated(shopDomain, body);
    } catch (err: any) {
      this.logger.error(`Order webhook error for ${shopDomain}:`, err.message);
      return { status: 'error' };
    }
  }

  @Post('refunds-create')
  async refundCreated(
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Body() body: any,
  ) {
    if (!shopDomain) {
      this.logger.warn('Missing X-Shopify-Shop-Domain header');
      return { status: 'ignored' };
    }

    try {
      return await this.shopifyWebhookService.handleRefundCreated(shopDomain, body);
    } catch (err: any) {
      this.logger.error(`Refund webhook error for ${shopDomain}:`, err.message);
      return { status: 'error' };
    }
  }

  @Post('app-uninstalled')
  async appUninstalled(
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    if (!shopDomain) {
      this.logger.warn('Missing X-Shopify-Shop-Domain header');
      return { status: 'ignored' };
    }

    try {
      return await this.shopifyWebhookService.handleAppUninstalled(shopDomain);
    } catch (err: any) {
      this.logger.error(`Uninstall webhook error for ${shopDomain}:`, err.message);
      return { status: 'error' };
    }
  }

  constructor(private readonly shopifyWebhookService: ShopifyWebhookService) {}
}
