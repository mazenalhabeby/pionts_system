import { Module } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { CustomersModule } from '../customers/customers.module';
import { ShopifyModule } from '../shopify/shopify.module';

@Module({
  imports: [CustomersModule, ShopifyModule],
  providers: [RedemptionsService],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
