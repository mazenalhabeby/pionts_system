import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { CustomersModule } from '../customers/customers.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CustomersModule, ReferralsModule, AuthModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
