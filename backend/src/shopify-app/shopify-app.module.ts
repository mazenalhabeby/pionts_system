import { Module } from '@nestjs/common';
import { ShopifyApiService } from './shopify-api.service';
import { ShopifyAppService } from './shopify-app.service';
import { ShopifyAppController } from './shopify-app.controller';
import { ShopifyOAuthRedirectController } from './shopify-oauth-redirect.controller';
import { ShopifyWebhookController } from './shopify-webhook.controller';
import { ShopifyWebhookService } from './shopify-webhook.service';
import { ShopifyWebhookHmacGuard } from './guards/shopify-hmac.guard';
import { ProjectsModule } from '../projects/projects.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [ProjectsModule, WebhooksModule],
  controllers: [ShopifyAppController, ShopifyOAuthRedirectController, ShopifyWebhookController],
  providers: [
    ShopifyApiService,
    ShopifyAppService,
    ShopifyAppController,
    ShopifyWebhookService,
    ShopifyWebhookHmacGuard,
  ],
  exports: [ShopifyApiService, ShopifyAppService],
})
export class ShopifyAppModule {}
