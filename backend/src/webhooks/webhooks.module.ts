import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { GenericWebhookController } from './generic-webhook.controller';
import { WebhooksService } from './webhooks.service';
import { CustomersModule } from '../customers/customers.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CustomersModule, ReferralsModule, AuthModule],
  controllers: [WebhooksController, GenericWebhookController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
