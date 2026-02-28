import { Global, Module } from '@nestjs/common';
import { ReferralCodeService } from './referral-code.service';

@Global()
@Module({
  providers: [ReferralCodeService],
  exports: [ReferralCodeService],
})
export class UtilsModule {}
