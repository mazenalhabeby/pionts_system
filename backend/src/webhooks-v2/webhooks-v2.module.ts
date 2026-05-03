import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhooksV2Controller } from './webhooks-v2.controller';
import { WebhooksV2Service, WEBHOOK_QUEUE } from './webhooks-v2.service';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),
    AuthModule,
  ],
  controllers: [WebhooksV2Controller],
  providers: [WebhooksV2Service, WebhookDeliveryProcessor],
  exports: [WebhooksV2Service],
})
export class WebhooksV2Module {}
