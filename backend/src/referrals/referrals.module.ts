import { Module, forwardRef } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => CustomersModule), NotificationsModule],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
