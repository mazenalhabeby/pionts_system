import { Module } from '@nestjs/common';
import { RewardsSpaController } from './rewards-spa.controller';
import { EmailService } from './email.service';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CustomersModule, NotificationsModule],
  controllers: [RewardsSpaController],
  providers: [EmailService],
  exports: [EmailService],
})
export class CustomerAuthModule {}
