import { Module } from '@nestjs/common';
import { ShopifyAppModule } from '../shopify-app/shopify-app.module';
import { ShopifyAdapter } from './adapters/shopify.adapter';
import { GenericApiAdapter } from './adapters/generic-api.adapter';
import { PlatformFactory } from './platform.factory';

@Module({
  imports: [ShopifyAppModule],
  providers: [ShopifyAdapter, GenericApiAdapter, PlatformFactory],
  exports: [PlatformFactory],
})
export class PlatformModule {}
