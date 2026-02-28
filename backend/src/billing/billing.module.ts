import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [AuthModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeService],
  exports: [BillingService],
})
export class BillingModule {}
