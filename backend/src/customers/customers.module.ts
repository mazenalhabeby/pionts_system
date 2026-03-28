import { Module, forwardRef } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { ReferralsModule } from '../referrals/referrals.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [forwardRef(() => ReferralsModule), NotificationsModule, BillingModule],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
