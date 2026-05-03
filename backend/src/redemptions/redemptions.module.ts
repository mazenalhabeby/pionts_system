import { Module } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { CustomersModule } from '../customers/customers.module';
import { PlatformModule } from '../platforms/platform.module';
import { WebhooksV2Module } from '../webhooks-v2/webhooks-v2.module';

@Module({
  imports: [CustomersModule, PlatformModule, WebhooksV2Module],
  providers: [RedemptionsService],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
