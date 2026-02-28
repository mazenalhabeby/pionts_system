import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SdkController } from './sdk.controller';
import { SdkService } from './sdk.service';
import { SdkAuthGuard } from './guards/sdk-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { RedemptionsModule } from '../redemptions/redemptions.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    }),
    AuthModule,
    CustomersModule,
    ReferralsModule,
    RedemptionsModule,
    CustomerAuthModule,
  ],
  controllers: [SdkController],
  providers: [SdkService, SdkAuthGuard],
})
export class SdkModule {}
