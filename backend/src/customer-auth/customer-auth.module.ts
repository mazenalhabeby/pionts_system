import { Module } from '@nestjs/common';
import { CustomerAuthController } from './customer-auth.controller';
import { RewardsSpaController } from './rewards-spa.controller';
import { EmailService } from './email.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CustomersModule, NotificationsModule],
  controllers: [CustomerAuthController, RewardsSpaController],
  providers: [EmailService, CustomerAuthGuard],
  exports: [CustomerAuthGuard, EmailService],
})
export class CustomerAuthModule {}
