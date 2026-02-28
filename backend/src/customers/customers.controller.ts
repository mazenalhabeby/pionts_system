import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomersService } from './customers.service';
import { AppConfigService } from '../config/app-config.service';
import { ReferralsService } from '../referrals/referrals.service';
import { CustomerAuthGuard } from '../customer-auth/customer-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { AwardTypeDto } from './dto/award.dto';
import { resolveProjectId } from '../common/helpers/project-resolver';

@Controller('api')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly configService: AppConfigService,
    private readonly referralsService: ReferralsService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const projectId = 1; // TODO: resolve from API key in Phase 2
    const customer = await this.customersService.getOrCreate(projectId, dto.email, dto.name);

    if (!customer.signupRewarded) {
      await this.customersService.ensureSignupRewarded(
        projectId,
        customer.id,
        this.configService.getInt(projectId, 'signup_points'),
      );
    }

    if (dto.referred_by && dto.referred_by !== customer.referralCode) {
      await this.referralsService.linkReferral(projectId, customer.id, dto.referred_by);
    }

    const updated = await this.customersService.findById(projectId, customer.id);
    return {
      referral_code: updated!.referralCode,
      points_balance: updated!.pointsBalance,
    };
  }

  @Get('customer/me')
  @UseGuards(CustomerAuthGuard)
  async getCustomer(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.resolveFromSession(projectId, req.session);

    const [history, referralStats, referralEarnings, pointsBreakdown, redemptionStats, tiers] =
      await Promise.all([
        this.customersService.getHistory(projectId, customer.id),
        this.referralsService.getReferralStats(projectId, customer.id),
        this.referralsService.getReferralEarnings(projectId, customer.id),
        this.customersService.getPointsBreakdown(projectId, customer.id),
        this.customersService.getCustomerRedemptionStats(projectId, customer.id),
        Promise.resolve(this.configService.getRedemptionTiers(projectId)),
      ]);

    return {
      name: customer.name,
      email: customer.email,
      points_balance: customer.pointsBalance,
      points_earned_total: customer.pointsEarnedTotal,
      order_count: customer.orderCount,
      referral_code: customer.referralCode,
      referred_by: customer.referredBy,
      signup_rewarded: !!customer.signupRewarded,
      first_order_rewarded: !!customer.firstOrderRewarded,
      followed_tiktok: !!customer.followedTiktok,
      followed_instagram: !!customer.followedInstagram,
      birthday: customer.birthday,
      birthday_rewarded_year: customer.birthdayRewardedYear,
      created_at: customer.createdAt,
      history,
      referral_stats: referralStats,
      referral_earnings: referralEarnings,
      points_breakdown: pointsBreakdown,
      redemption_stats: redemptionStats,
      redemption_tiers: tiers,
    };
  }

  @Get('customer/referrals')
  @UseGuards(CustomerAuthGuard)
  async getMyReferrals(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.resolveFromSession(projectId, req.session);

    const [stats, directReferrals, earnings, downlineTree] = await Promise.all([
      this.referralsService.getReferralStats(projectId, customer.id),
      this.referralsService.getDirectReferralsDetailed(projectId, customer.id),
      this.referralsService.getReferralEarnings(projectId, customer.id),
      this.referralsService.getCustomerDownlineTree(projectId, customer.id),
    ]);

    return {
      referral_code: customer.referralCode,
      referral_link: `https://8bc.store?ref=${customer.referralCode}`,
      stats,
      direct_referrals: directReferrals,
      total_referral_earnings: earnings,
      downline_tree: downlineTree,
    };
  }

  @Post('award')
  @UseGuards(CustomerAuthGuard)
  async award(@Req() req: Request, @Body() dto: AwardTypeDto) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.resolveFromSession(projectId, req.session);

    const typeMap: Record<string, { points: number; desc: string; flag?: string }> = {
      review_photo: { points: this.configService.getInt(projectId, 'review_photo_points'), desc: 'Photo review submitted' },
      review_text: { points: this.configService.getInt(projectId, 'review_text_points'), desc: 'Text review submitted' },
      follow_tiktok: { points: this.configService.getInt(projectId, 'follow_tiktok_points'), desc: 'Followed on TikTok', flag: 'followed_tiktok' },
      follow_instagram: { points: this.configService.getInt(projectId, 'follow_instagram_points'), desc: 'Followed on Instagram', flag: 'followed_instagram' },
      share_product: { points: this.configService.getInt(projectId, 'share_product_points'), desc: 'Shared a product' },
      birthday: { points: this.configService.getInt(projectId, 'birthday_points'), desc: 'Birthday bonus!' },
    };

    const action = typeMap[dto.type];
    if (!action) throw new BadRequestException('Invalid award type');

    // Check one-time flags using the shared FLAG_MAP
    if (action.flag && this.customersService.isFlagSet(customer, action.flag)) {
      throw new BadRequestException('Already claimed');
    }

    if (dto.type === 'birthday') {
      const currentYear = new Date().getFullYear();
      if (customer.birthdayRewardedYear >= currentYear) {
        throw new BadRequestException('Birthday bonus already claimed this year');
      }
      const newBalance = await this.customersService.awardPoints(projectId, customer.id, action.points, dto.type, action.desc);
      await this.customersService.setBirthdayYear(customer.id, currentYear);
      return { points_awarded: action.points, new_balance: newBalance };
    }

    const newBalance = await this.customersService.awardPoints(projectId, customer.id, action.points, dto.type, action.desc);
    if (action.flag) await this.customersService.setFlag(customer.id, action.flag);
    return { points_awarded: action.points, new_balance: newBalance };
  }
}
