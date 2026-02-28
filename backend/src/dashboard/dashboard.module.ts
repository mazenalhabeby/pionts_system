import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [AuthModule, CustomersModule, ReferralsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
