import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  UnauthorizedException, BadRequestException, Req,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { SdkAuthGuard } from './guards/sdk-auth.guard';
import { SdkCustomer, SdkProject } from './decorators/sdk-customer.decorator';
import { SdkService } from './sdk.service';
import { CustomersService } from '../customers/customers.service';
import { ReferralsService } from '../referrals/referrals.service';
import { RedemptionsService } from '../redemptions/redemptions.service';
import { AppConfigService } from '../config/app-config.service';
import { EarnActionsService } from '../earn-actions/earn-actions.service';
import { SdkSignupDto } from './dto/sdk-signup.dto';
import { SdkAwardDto } from './dto/sdk-award.dto';
import { SdkRedeemDto } from './dto/sdk-redeem.dto';
import { SdkPartnerApplyDto } from './dto/sdk-partner-apply.dto';
import { EmailService } from '../customer-auth/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { ShopifyApiService } from '../shopify-app/shopify-api.service';
import { Customer, Project } from '@prisma/client';
import { parseBirthday, validateBirthdayAge, calculateAge } from '../utils/date-helpers';
import { LIMITS } from '../common/constants';

@ApiTags('SDK')
@Controller('api/v1/sdk')
@UseGuards(SdkAuthGuard)
@SkipThrottle()
export class SdkController {
  constructor(
    private readonly sdkService: SdkService,
    private readonly customersService: CustomersService,
    private readonly referralsService: ReferralsService,
    private readonly redemptionsService: RedemptionsService,
    private readonly configService: AppConfigService,
    private readonly earnActionsService: EarnActionsService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly partnersService: PartnersService,
    private readonly shopifyApi: ShopifyApiService,
  ) {}

  private requireCustomer(customer: Customer | null): asserts customer is Customer {
    if (!customer) throw new UnauthorizedException('Customer authentication required');
  }

  @Get('config')
  async getConfig(@SdkProject() project: Project) {
    return this.sdkService.getProjectConfig(project.id);
  }

  @Get('customer')
  async getCustomer(@SdkCustomer() customer: Customer | null, @SdkProject() project: Project, @Req() req: any) {
    this.requireCustomer(customer);

    // Link referral code from SDK cookie (sent via X-Referral-Code header)
    const refCode = req.headers['x-referral-code'];
    if (refCode) {
      const fullProject = await this.sdkService.getProject(project.id);
      if (fullProject?.referralsEnabled) {
        const linked = await this.referralsService.linkReferralIfNeeded(
          project.id, customer.id, refCode as string, customer.referralCode, customer.referredBy,
        );
        if (linked) {
          const updated = await this.customersService.findById(project.id, customer.id);
          if (updated) {
            return this.sdkService.getCustomerData(project.id, updated);
          }
        }
      }
    }

    // Award signup points if HMAC-created and not yet rewarded
    if (!customer.signupRewarded) {
      const fullProject = await this.sdkService.getProject(project.id);
      if (fullProject?.pointsEnabled) {
        await this.earnActionsService.awardActionIfNeeded(
          project.id, customer.id, 'signup', this.customersService, 'Welcome bonus!',
        );
      }
      const updated = await this.customersService.findById(project.id, customer.id);
      if (updated) {
        return this.sdkService.getCustomerData(project.id, updated);
      }
    }

    return this.sdkService.getCustomerData(project.id, customer);
  }

  @Post('signup')
  async signup(@SdkProject() project: Project, @Body() dto: SdkSignupDto, @Req() req: any) {
    const fullProject = await this.sdkService.getProject(project.id);
    const customer = await this.customersService.getOrCreate(project.id, dto.email, dto.name);

    // Award signup points if not already (and points enabled)
    if (fullProject?.pointsEnabled) {
      await this.earnActionsService.awardActionIfNeeded(
        project.id, customer.id, 'signup', this.customersService, 'Welcome bonus!',
      );
    }

    // Link referral if code provided (and referrals enabled)
    if (dto.referral_code && fullProject?.referralsEnabled) {
      await this.referralsService.linkReferralIfNeeded(
        project.id, customer.id, dto.referral_code, customer.referralCode, customer.referredBy,
      );
    }

    const updated = await this.customersService.findByEmail(project.id, dto.email);

    return {
      referral_code: updated!.referralCode,
      points_balance: updated!.pointsBalance,
    };
  }

  @Post('redeem')
  async redeem(@SdkCustomer() customer: Customer | null, @SdkProject() project: Project, @Body() dto: SdkRedeemDto) {
    this.requireCustomer(customer);
    return this.redemptionsService.redeemGeneric(project.id, customer, dto.tier_points);
  }

  @Post('social/initiate')
  async initiateSocialFollow(
    @SdkCustomer() customer: Customer | null,
    @SdkProject() project: Project,
    @Body() body: { type: string },
  ) {
    this.requireCustomer(customer);

    const slug = body.type;
    if (!slug) throw new BadRequestException('Action type is required');

    const action = await this.earnActionsService.getAction(project.id, slug);
    if (!action || !action.enabled) {
      throw new BadRequestException('Unknown or disabled action');
    }
    if (action.category !== 'social_follow') {
      throw new BadRequestException('Action is not a social follow');
    }

    // Check if already completed
    const done = await this.earnActionsService.hasCompleted(project.id, customer.id, slug);
    if (done) {
      throw new BadRequestException('Already completed');
    }

    const claim = await this.earnActionsService.initiateSocialClaim(project.id, customer.id, slug);
    return { initiated: true, initiated_at: claim.initiatedAt.toISOString() };
  }

  @Post('award')
  async award(@SdkCustomer() customer: Customer | null, @SdkProject() project: Project, @Body() dto: SdkAwardDto) {
    this.requireCustomer(customer);

    const slug = dto.type;
    const action = await this.earnActionsService.getAction(project.id, slug);
    if (!action || !action.enabled) {
      throw new BadRequestException('Unknown or disabled action');
    }

    // Birthday-specific validation
    if (slug === 'birthday') {
      if (!customer.birthday) {
        throw new BadRequestException('Birthday not set. Please set your birthday first.');
      }
      const [monthStr] = customer.birthday.split('-');
      const birthdayMonth = parseInt(monthStr, 10);
      const currentMonth = new Date().getMonth() + 1;
      if (birthdayMonth !== currentMonth) {
        throw new BadRequestException('Birthday bonus is only available during your birthday month.');
      }
    }

    // Social follow verification: require initiation + delay elapsed
    if (action.category === 'social_follow') {
      const claimStatus = await this.earnActionsService.getSocialClaimStatus(project.id, customer.id, slug);
      if (!claimStatus || !claimStatus.initiated) {
        throw new BadRequestException('Social follow must be initiated first');
      }
      if (claimStatus.claimed) {
        return { points_awarded: 0, new_balance: customer.pointsBalance };
      }
      const delaySec = this.configService.getInt(project.id, 'social_follow_claim_delay') || 30;
      const elapsed = (Date.now() - new Date(claimStatus.initiated_at).getTime()) / 1000;
      if (elapsed < delaySec) {
        const remaining = Math.ceil(delaySec - elapsed);
        throw new BadRequestException(`Please wait ${remaining} more seconds before claiming`);
      }
      await this.earnActionsService.completeSocialClaim(project.id, customer.id, slug);
    }

    // Check completion based on frequency
    if (action.frequency === 'one_time') {
      const done = await this.earnActionsService.hasCompleted(project.id, customer.id, slug);
      if (done) return { points_awarded: 0, new_balance: customer.pointsBalance };
    } else if (action.frequency === 'yearly') {
      const year = new Date().getFullYear();
      const done = await this.earnActionsService.hasCompleted(project.id, customer.id, slug, year);
      if (done) return { points_awarded: 0, new_balance: customer.pointsBalance };
    }
    // 'repeatable' actions always proceed

    const newBalance = await this.customersService.awardPoints(
      project.id, customer.id, action.points, slug, action.label,
    );

    // Mark completed
    if (action.frequency === 'one_time') {
      await this.earnActionsService.markCompleted(project.id, customer.id, slug);
    } else if (action.frequency === 'yearly') {
      await this.earnActionsService.markCompleted(project.id, customer.id, slug, new Date().getFullYear());
    }

    return { points_awarded: action.points, new_balance: newBalance };
  }

  @Put('customer/profile')
  async updateProfile(@SdkCustomer() customer: Customer | null, @Body() body: { name?: string; birthday?: string }) {
    this.requireCustomer(customer);
    if (!body.name && !body.birthday) {
      throw new BadRequestException('At least name or birthday is required');
    }
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed || trimmed.length < LIMITS.MIN_NAME_LENGTH) {
        throw new BadRequestException(`Name must be at least ${LIMITS.MIN_NAME_LENGTH} characters`);
      }
      await this.customersService.updateName(customer.id, trimmed);
    }
    if (body.birthday !== undefined) {
      const parsed = parseBirthday(body.birthday);
      if (parsed.year) {
        validateBirthdayAge(parsed.year, parsed.month, parsed.day);
      }
      await this.customersService.setBirthday(customer.id, body.birthday);
    }
    return { success: true };
  }

  @Put('customer/birthday')
  async setBirthday(@SdkCustomer() customer: Customer | null, @Body() body: { birthday: string }) {
    this.requireCustomer(customer);
    if (!body.birthday) throw new BadRequestException('Birthday is required');
    parseBirthday(body.birthday);
    await this.customersService.setBirthday(customer.id, body.birthday);
    return { success: true, birthday: body.birthday };
  }

  @Get('check-ref/:code')
  async checkReferralCode(@SdkProject() project: Project, @Param('code') code: string) {
    const referrer = await this.customersService.findByReferralCode(project.id, code);
    if (!referrer) return { valid: false };

    const discountPercent = this.configService.getInt(project.id, 'referral_discount_percent');
    return {
      valid: true,
      referrer_name: referrer.name || undefined,
      discount_percent: discountPercent,
    };
  }

  @Get('customer/referrals')
  async getCustomerReferrals(@SdkCustomer() customer: Customer | null, @SdkProject() project: Project) {
    this.requireCustomer(customer);

    const [stats, directReferrals, downlineTree, totalReferralEarnings] = await Promise.all([
      this.referralsService.getReferralStats(project.id, customer.id),
      this.referralsService.getDirectReferralsDetailed(project.id, customer.id),
      this.referralsService.getCustomerDownlineTree(project.id, customer.id),
      this.referralsService.getReferralEarnings(project.id, customer.id),
    ]);

    let baseUrl = this.configService.get(project.id, 'referral_base_url');
    if (!baseUrl) {
      const fullProject = await this.sdkService.getProject(project.id);
      if (fullProject?.domain) {
        baseUrl = fullProject.domain.startsWith('http')
          ? fullProject.domain
          : `https://${fullProject.domain}`;
      }
    }
    const referralLink = baseUrl
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ref=${customer.referralCode}`
      : undefined;

    return {
      referral_code: customer.referralCode,
      referral_link: referralLink,
      stats,
      direct_referrals: directReferrals,
      downline_tree: downlineTree,
      total_referral_earnings: totalReferralEarnings,
    };
  }

  @Get('customer/redemptions')
  async getCustomerRedemptions(@SdkCustomer() customer: Customer | null, @SdkProject() project: Project) {
    this.requireCustomer(customer);
    return this.redemptionsService.getCustomerRedemptions(project.id, customer.id);
  }

  @Delete('customer/redemptions/:id')
  async cancelRedemption(@SdkCustomer() customer: Customer | null, @SdkProject() project: Project, @Param('id') id: string) {
    this.requireCustomer(customer);
    return this.redemptionsService.cancelRedemption(project.id, customer.id, Number(id));
  }

  @Post('auth/send-code')
  async sendCode(@SdkProject() project: Project, @Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('Email is required');

    const customer = await this.customersService.getOrCreate(project.id, body.email);
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + LIMITS.VERIFICATION_CODE_EXPIRY_MS).toISOString();

    await this.customersService.saveVerificationCode(customer.id, code, expiry);

    const settings = await this.configService.getAll(project.id);
    const brandName = settings.email_from_name || settings.widget_brand_name || project.name;
    const primaryColor = settings.widget_primary_color || '#3b82f6';

    const sent = await this.emailService.sendVerificationCode(body.email, code, brandName, primaryColor);
    if (!sent) throw new BadRequestException('Failed to send verification email. Please try again.');

    return { success: true };
  }

  @Post('auth/verify-code')
  async verifyCode(@SdkProject() project: Project, @Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) throw new BadRequestException('Email and code are required');

    const customer = await this.customersService.findByEmail(project.id, body.email);
    if (!customer) throw new UnauthorizedException('Customer not found');

    if (
      !customer.verificationCode ||
      customer.verificationCode !== body.code ||
      !customer.verificationExpiry ||
      new Date(customer.verificationExpiry) < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    await this.customersService.clearVerificationCode(customer.id);

    const token = this.sdkService.generateCustomerToken(project.id, body.email);
    const { accessToken, refreshToken } = this.sdkService.generateCustomerTokens(project.id, body.email);
    return { token, accessToken, refreshToken };
  }

  @Post('auth/refresh')
  async refreshToken(@SdkProject() project: Project, @Body() body: { refreshToken: string }) {
    if (!body.refreshToken) throw new BadRequestException('Refresh token is required');

    const tokens = await this.sdkService.refreshCustomerTokens(body.refreshToken);
    if (!tokens) throw new UnauthorizedException('Invalid or expired refresh token');

    // Verify the refresh token belongs to this project
    const payload = this.sdkService.verifyCustomerToken(tokens.accessToken);
    if (!payload || payload.projectId !== project.id) {
      throw new UnauthorizedException('Token does not match project');
    }

    return tokens;
  }

  @Post('partner/apply')
  async applyPartner(
    @SdkCustomer() customer: Customer | null,
    @SdkProject() project: Project,
    @Body() body: SdkPartnerApplyDto,
  ) {
    this.requireCustomer(customer);

    if (!project.partnersEnabled) {
      throw new BadRequestException('Partner program is not enabled');
    }

    if (customer.isPartner) {
      return { success: true, status: 'already_partner' };
    }

    // Check if already applied
    const existing = await this.prisma.partnerApplication.findUnique({
      where: { projectId_customerId: { projectId: project.id, customerId: customer.id } },
    });
    if (existing) {
      return { success: existing.status === 'approved', status: existing.status };
    }

    // Validate age >= 18
    const age = calculateAge(body.dateOfBirth);

    if (age < LIMITS.MIN_AGE_PARTNER) {
      await this.prisma.partnerApplication.create({
        data: {
          projectId: project.id,
          customerId: customer.id,
          status: 'rejected',
          dateOfBirth: body.dateOfBirth,
          socialMedia: body.socialMedia as any,
          address: body.address,
          city: body.city,
          postalCode: body.postalCode,
          country: body.country,
          iban: body.iban,
          rejectionReason: 'under_18',
        },
      });
      return { success: false, status: 'rejected', reason: 'under_18' };
    }

    // Approved — save application + promote to partner
    await this.prisma.partnerApplication.create({
      data: {
        projectId: project.id,
        customerId: customer.id,
        status: 'approved',
        dateOfBirth: body.dateOfBirth,
        socialMedia: body.socialMedia as any,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country,
        iban: body.iban,
      },
    });

    const defaultCommission = this.configService.getInt(project.id, 'partner_default_commission_pct') || 10;
    await this.partnersService.promoteToPartner(project.id, customer.id, defaultCommission);

    return { success: true, status: 'approved' };
  }

  /**
   * Resolve a Shopify customer ID to a Pionts customer email.
   * Used by the Shopify Customer Account Extension.
   *
   * Flow:
   * 1. If customer already in DB by shopifyId → return immediately
   * 2. If email provided (from extension prompt) → create customer with Shopify ID link
   * 3. If ShopifyInstallation exists → use Admin API to resolve email
   * 4. Otherwise → return needs_email: true so extension shows email input
   */
  @Post('shopify/identify')
  async shopifyIdentify(
    @SdkProject() project: Project,
    @Body() body: { shopify_customer_id: string; email?: string; name?: string },
  ) {
    const shopifyId = body.shopify_customer_id;
    if (!shopifyId) throw new BadRequestException('shopify_customer_id is required');

    // 1. Check if we already have this customer in our DB
    const existing = await this.customersService.findByShopifyId(project.id, shopifyId);
    if (existing) {
      return { found: true, email: existing.email, name: existing.name || '' };
    }

    // 2. If email provided by extension (user entered it), create/link the customer
    if (body.email) {
      const customer = await this.customersService.getOrCreate(
        project.id,
        body.email,
        body.name || undefined,
        shopifyId,
      );
      return { found: true, email: customer.email, name: customer.name || '' };
    }

    // 3. Try Shopify Admin API if we have an installation with access token
    const installation = await this.prisma.shopifyInstallation.findUnique({
      where: { projectId: project.id },
    });
    if (installation?.accessToken && !installation.uninstalledAt) {
      const shopifyCustomer = await this.shopifyApi.getCustomerById(
        installation.shopDomain,
        installation.accessToken,
        shopifyId,
      );
      if (shopifyCustomer?.email) {
        const customer = await this.customersService.getOrCreate(
          project.id,
          shopifyCustomer.email,
          `${shopifyCustomer.firstName} ${shopifyCustomer.lastName}`.trim() || undefined,
          shopifyId,
        );
        return { found: true, email: customer.email, name: customer.name || '' };
      }
    }

    // 4. No way to resolve email — tell extension to ask the customer
    return { found: false, needs_email: true };
  }

  @Get('leaderboard')
  async getLeaderboard(@SdkProject() project: Project) {
    return this.sdkService.getLeaderboard(project.id);
  }
}
