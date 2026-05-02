import { Module } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { CustomersModule } from '../customers/customers.module';
import { PlatformModule } from '../platforms/platform.module';

@Module({
  imports: [CustomersModule, PlatformModule],
  providers: [RedemptionsService],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
