import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RedemptionsService } from './redemptions.service';
import { CustomersService } from '../customers/customers.service';
import { CustomerAuthGuard } from '../customer-auth/customer-auth.guard';
import { RedeemDto } from '../customers/dto/redeem.dto';
import { resolveProjectId } from '../common/helpers/project-resolver';

@Controller('api')
export class RedemptionsController {
  constructor(
    private readonly redemptionsService: RedemptionsService,
    private readonly customersService: CustomersService,
  ) {}

  @Get('customer/redemptions')
  @UseGuards(CustomerAuthGuard)
  async getMyRedemptions(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.resolveFromSession(projectId, req.session);
    return this.redemptionsService.getCustomerRedemptions(projectId, customer.id);
  }

  @Post('redeem')
  @UseGuards(CustomerAuthGuard)
  async redeem(@Req() req: Request, @Body() dto: RedeemDto) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.resolveFromSession(projectId, req.session);
    return this.redemptionsService.redeem(projectId, customer, dto.tier_points);
  }
}
