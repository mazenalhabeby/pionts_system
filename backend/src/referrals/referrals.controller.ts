import { Controller, Get, Param } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { AppConfigService } from '../config/app-config.service';

@Controller('api')
export class ReferralsController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly configService: AppConfigService,
  ) {}

  @Get('check-ref/:code')
  async checkRef(@Param('code') code: string) {
    const projectId = 1; // TODO: resolve from API key in Phase 2
    const customer = await this.customersService.findByReferralCode(projectId, code);
    if (!customer) return { valid: false };
    return {
      valid: true,
      referrer_name: customer.name,
      discount_percent: this.configService.getInt(projectId, 'referral_discount_percent'),
    };
  }
}
