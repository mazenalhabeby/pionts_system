import { Module, forwardRef } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { ReferralsModule } from '../referrals/referrals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';
import { WebhooksV2Module } from '../webhooks-v2/webhooks-v2.module';

@Module({
  imports: [forwardRef(() => ReferralsModule), NotificationsModule, BillingModule, WebhooksV2Module],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
