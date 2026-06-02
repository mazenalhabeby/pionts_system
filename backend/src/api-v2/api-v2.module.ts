import { Module } from '@nestjs/common';
import { ApiV2Controller } from './api-v2.controller';
import { ApiKeyV2Guard } from './guards/api-key-v2.guard';
import { AuthModule } from '../auth/auth.module';
import { DiscountModule } from '../discount/discount.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CustomersModule } from '../customers/customers.module';
import { RedemptionsModule } from '../redemptions/redemptions.module';
import { SdkModule } from '../sdk/sdk.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    AuthModule,
    DiscountModule,
    WebhooksModule,
    CustomersModule,
    RedemptionsModule,
    SdkModule,
    ReferralsModule,
  ],
  controllers: [ApiV2Controller],
  providers: [ApiKeyV2Guard],
})
export class ApiV2Module {}
