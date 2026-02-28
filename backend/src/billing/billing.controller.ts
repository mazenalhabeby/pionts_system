import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { PLAN_LIMITS } from './billing.constants';

@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
  ) {}

  @Get('subscription')
  async getSubscription(@Req() req: any) {
    const orgId = req.user.orgId;
    const sub = await this.billingService.getSubscription(orgId);
    const plan = this.billingService.getOrgPlan(sub);
    const usage = await this.billingService.getUsage(orgId);
    const limits = PLAN_LIMITS[plan];

    return {
      plan,
      label: limits.label,
      priceMonthly: limits.priceMonthly,
      limits: {
        maxProjects: limits.maxProjects === Infinity ? null : limits.maxProjects,
        maxCustomersPerProject: limits.maxCustomersPerProject === Infinity ? null : limits.maxCustomersPerProject,
      },
      usage,
      stripeConfigured: this.stripeService.isConfigured,
      currentPeriodEnd: sub?.currentPeriodEnd || null,
      status: sub?.status || 'active',
    };
  }

  @Post('checkout')
  async createCheckout(@Req() req: any, @Body() body: { successUrl: string; cancelUrl: string }) {
    const orgId = req.user.orgId;
    const sub = await this.billingService.getSubscription(orgId);
    if (!sub) {
      return { error: 'No billing account found' };
    }

    const url = await this.stripeService.createCheckoutSession(
      sub.stripeCustomerId,
      body.successUrl,
      body.cancelUrl,
    );
    return { url };
  }

  @Post('portal')
  async createPortal(@Req() req: any, @Body() body: { returnUrl: string }) {
    const orgId = req.user.orgId;
    const sub = await this.billingService.getSubscription(orgId);
    if (!sub) {
      return { error: 'No billing account found' };
    }

    const url = await this.stripeService.createPortalSession(sub.stripeCustomerId, body.returnUrl);
    return { url };
  }
}
