import { Module } from '@nestjs/common';
import { ShopifyApiService } from './shopify-api.service';
import { ShopifyAppService } from './shopify-app.service';
import { ShopifyAppController } from './shopify-app.controller';
import { ShopifyWebhookController } from './shopify-webhook.controller';
import { ShopifyWebhookService } from './shopify-webhook.service';
import { ShopifyWebhookHmacGuard } from './guards/shopify-hmac.guard';
import { ProjectsModule } from '../projects/projects.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [ProjectsModule, WebhooksModule],
  controllers: [ShopifyAppController, ShopifyWebhookController],
  providers: [
    ShopifyApiService,
    ShopifyAppService,
    ShopifyWebhookService,
    ShopifyWebhookHmacGuard,
  ],
  exports: [ShopifyApiService, ShopifyAppService],
})
export class ShopifyAppModule {}
