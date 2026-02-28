import { Module } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { RedemptionsController } from './redemptions.controller';
import { CustomersModule } from '../customers/customers.module';
import { ShopifyModule } from '../shopify/shopify.module';

@Module({
  imports: [CustomersModule, ShopifyModule],
  controllers: [RedemptionsController],
  providers: [RedemptionsService],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
