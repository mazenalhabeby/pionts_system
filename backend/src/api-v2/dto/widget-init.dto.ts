import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class WidgetInitDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  // Hybrid referral attribution: when present, attach as referred_by on
  // first customer creation. No-ops if the customer already has a referrer
  // (anti-stealing) or if the code is the customer's own (anti-self-ref) -
  // both enforced inside ReferralsService.linkReferralIfNeeded.
  @IsString()
  @IsOptional()
  referralCode?: string;
}
