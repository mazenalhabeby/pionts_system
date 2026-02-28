import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CustomersModule } from '../customers/customers.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [CustomersModule, ReferralsModule],
  controllers: [AdminController],
})
export class AdminModule {}
