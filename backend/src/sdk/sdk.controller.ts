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
  ) {}

  private requireCustomer(customer: any): void {
    if (!customer) throw new UnauthorizedException('Customer authentication required');
  }

  @Get('config')
  async getConfig(@SdkProject() project: any) {
    return this.sdkService.getProjectConfig(project.id);
  }

  @Get('customer')
  async getCustomer(@SdkCustomer() customer: any, @SdkProject() project: any, @Req() req: any) {
    this.requireCustomer(customer);

    // Link referral code from SDK cookie (sent via X-Referral-Code header)
    const refCode = req.headers['x-referral-code'];
    if (refCode && !customer.referredBy) {
      const fullProject = await this.sdkService.getProject(project.id);
      if (fullProject?.referralsEnabled && refCode !== customer.referralCode) {
        try {
          await this.referralsService.linkReferral(project.id, customer.id, refCode);
          // Re-fetch customer with updated referral data
          const updated = await this.customersService.findById(project.id, customer.id);
          if (updated) {
            return this.sdkService.getCustomerData(project.id, updated);
          }
        } catch {
          // Invalid referral code — proceed without linking
        }
      }
    }

    // Award signup points if HMAC-created and not yet rewarded
    if (!customer.signupRewarded) {
      const fullProject = await this.sdkService.getProject(project.id);
      if (fullProject?.pointsEnabled) {
        const signupAction = await this.earnActionsService.getAction(project.id, 'signup');
        if (signupAction?.enabled) {
          const done = await this.earnActionsService.hasCompleted(project.id, customer.id, 'signup');
          if (!done) {
            await this.customersService.awardPoints(
              project.id, customer.id, signupAction.points, 'signup', 'Welcome bonus!',
            );
            await this.earnActionsService.markCompleted(project.id, customer.id, 'signup');
          }
        }
      }
      const updated = await this.customersService.findById(project.id, customer.id);
      if (updated) {
        return this.sdkService.getCustomerData(project.id, updated);
      }
    }

    return this.sdkService.getCustomerData(project.id, customer);
  }

  @Post('signup')
  async signup(@SdkProject() project: any, @Body() dto: SdkSignupDto, @Req() req: any) {
    const fullProject = await this.sdkService.getProject(project.id);
    const customer = await this.customersService.getOrCreate(project.id, dto.email, dto.name);

    // Award signup points if not already (and points enabled)
    if (fullProject?.pointsEnabled) {
      const signupAction = await this.earnActionsService.getAction(project.id, 'signup');
      if (signupAction?.enabled) {
        const done = await this.earnActionsService.hasCompleted(project.id, customer.id, 'signup');
        if (!done) {
          await this.customersService.awardPoints(
            project.id, customer.id, signupAction.points, 'signup', 'Welcome bonus!',
          );
          await this.earnActionsService.markCompleted(project.id, customer.id, 'signup');
        }
      }
    }

    // Link referral if code provided (and referrals enabled)
    if (dto.referral_code && !customer.referredBy && fullProject?.referralsEnabled) {
      if (dto.referral_code !== customer.referralCode) {
        await this.referralsService.linkReferral(project.id, customer.id, dto.referral_code);
      }
    }

    const updated = await this.customersService.findByEmail(project.id, dto.email);

    return {
      referral_code: updated!.referralCode,
      points_balance: updated!.pointsBalance,
    };
  }

  @Post('redeem')
  async redeem(@SdkCustomer() customer: any, @SdkProject() project: any, @Body() dto: SdkRedeemDto) {
    this.requireCustomer(customer);
    return this.redemptionsService.redeemGeneric(project.id, customer, dto.tier_points);
  }

  @Post('social/initiate')
  async initiateSocialFollow(
    @SdkCustomer() customer: any,
    @SdkProject() project: any,
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
  async award(@SdkCustomer() customer: any, @SdkProject() project: any, @Body() dto: SdkAwardDto) {
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
  async updateProfile(@SdkCustomer() customer: any, @Body() body: { name?: string; birthday?: string }) {
    this.requireCustomer(customer);
    if (!body.name && !body.birthday) {
      throw new BadRequestException('At least name or birthday is required');
    }
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed || trimmed.length < 2) {
        throw new BadRequestException('Name must be at least 2 characters');
      }
      await this.customersService.updateName(customer.id, trimmed);
    }
    if (body.birthday !== undefined) {
      // Support both YYYY-MM-DD (new) and MM-DD (legacy) formats
      const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(body.birthday);
      const isLegacyDate = /^\d{2}-\d{2}$/.test(body.birthday);

      if (!isFullDate && !isLegacyDate) {
        throw new BadRequestException('Birthday must be in YYYY-MM-DD or MM-DD format');
      }

      const parts = body.birthday.split('-');
      let year: number | null = null;
      let month: number;
      let day: number;

      if (isFullDate) {
        // YYYY-MM-DD format
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);

        // Validate age (13-120 years)
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 13 || age > 120) {
          throw new BadRequestException('Invalid birth date');
        }
      } else {
        // MM-DD format (legacy)
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
      }

      if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new BadRequestException('Invalid birthday date');
      }

      await this.customersService.setBirthday(customer.id, body.birthday);
    }
    return { success: true };
  }

  @Put('customer/birthday')
  async setBirthday(@SdkCustomer() customer: any, @Body() body: { birthday: string }) {
    this.requireCustomer(customer);
    if (!body.birthday || !/^\d{2}-\d{2}$/.test(body.birthday)) {
      throw new BadRequestException('Birthday must be in MM-DD format');
    }
    const [monthStr, dayStr] = body.birthday.split('-');
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new BadRequestException('Invalid birthday date');
    }
    await this.customersService.setBirthday(customer.id, body.birthday);
    return { success: true, birthday: body.birthday };
  }

  @Get('check-ref/:code')
  async checkReferralCode(@SdkProject() project: any, @Param('code') code: string) {
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
  async getCustomerReferrals(@SdkCustomer() customer: any, @SdkProject() project: any) {
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
  async getCustomerRedemptions(@SdkCustomer() customer: any, @SdkProject() project: any) {
    this.requireCustomer(customer);
    return this.redemptionsService.getCustomerRedemptions(project.id, customer.id);
  }

  @Delete('customer/redemptions/:id')
  async cancelRedemption(@SdkCustomer() customer: any, @SdkProject() project: any, @Param('id') id: string) {
    this.requireCustomer(customer);
    return this.redemptionsService.cancelRedemption(project.id, customer.id, Number(id));
  }

  @Post('auth/send-code')
  async sendCode(@SdkProject() project: any, @Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('Email is required');

    const customer = await this.customersService.getOrCreate(project.id, body.email);
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await this.customersService.saveVerificationCode(customer.id, code, expiry);
    await this.emailService.sendVerificationCode(body.email, code);

    return { success: true };
  }

  @Post('auth/verify-code')
  async verifyCode(@SdkProject() project: any, @Body() body: { email: string; code: string }) {
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
  async refreshToken(@SdkProject() project: any, @Body() body: { refreshToken: string }) {
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
    @SdkCustomer() customer: any,
    @SdkProject() project: any,
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
    const dob = new Date(body.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
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

  @Get('leaderboard')
  async getLeaderboard(@SdkProject() project: any) {
    return this.sdkService.getLeaderboard(project.id);
  }
}
