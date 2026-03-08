import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AppConfigService } from '../config/app-config.service';
import { EarnActionsService } from '../earn-actions/earn-actions.service';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class SdkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly referralsService: ReferralsService,
    private readonly configService: AppConfigService,
    private readonly jwtService: JwtService,
    private readonly earnActionsService: EarnActionsService,
    private readonly partnersService: PartnersService,
  ) {}

  async getProject(projectId: number) {
    return this.prisma.project.findUnique({ where: { id: projectId } });
  }

  async getCustomerData(projectId: number, customer: any) {
    const project = await this.getProject(projectId);

    const [
      history, referralStats, referralEarnings, pointsBreakdown,
      redemptionStats, earnActions, completedSlugs, redemptionTiers,
      referralLevels, partnerInfo, pendingSocialClaims,
    ] = await Promise.all([
      this.customersService.getHistory(projectId, customer.id),
      project?.referralsEnabled
        ? this.referralsService.getReferralStats(projectId, customer.id)
        : { direct: 0, network: 0 },
      project?.referralsEnabled
        ? this.referralsService.getReferralEarnings(projectId, customer.id)
        : 0,
      this.customersService.getPointsBreakdown(projectId, customer.id),
      this.customersService.getCustomerRedemptionStats(projectId, customer.id),
      project?.pointsEnabled
        ? this.earnActionsService.getEnabledActions(projectId)
        : [],
      this.earnActionsService.getCompletedSlugs(projectId, customer.id),
      project?.pointsEnabled
        ? this.configService.getRedemptionTiers(projectId)
        : [],
      project?.referralsEnabled
        ? this.configService.getReferralLevels(projectId)
        : [],
      project?.partnersEnabled && customer.isPartner
        ? this.partnersService.getPartnerInfo(projectId, customer.id)
        : null,
      this.earnActionsService.getPendingSocialClaims(projectId, customer.id),
    ]);

    const settings = await this.getProjectPublicSettings(projectId);

    // Map earn actions with completion status
    const actionsWithStatus = earnActions.map((a: any) => ({
      id: a.id,
      slug: a.slug,
      label: a.label,
      points: a.points,
      category: a.category,
      frequency: a.frequency,
      enabled: a.enabled,
      social_url: a.socialUrl,
      sort_order: a.sortOrder,
      completed: completedSlugs.has(a.slug),
    }));

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      referral_code: customer.referralCode,
      referred_by: customer.referredBy,
      points_balance: customer.pointsBalance,
      points_earned_total: customer.pointsEarnedTotal,
      order_count: customer.orderCount,
      signup_rewarded: customer.signupRewarded,
      first_order_rewarded: customer.firstOrderRewarded,
      followed_tiktok: customer.followedTiktok,
      followed_instagram: customer.followedInstagram,
      birthday: customer.birthday,
      created_at: customer.createdAt,
      is_partner: customer.isPartner,
      history,
      referral_stats: referralStats,
      referral_earnings: referralEarnings,
      points_breakdown: pointsBreakdown,
      redemption_stats: redemptionStats,
      redemption_tiers: redemptionTiers,
      settings,
      enabled_modules: {
        points: project?.pointsEnabled ?? true,
        referrals: project?.referralsEnabled ?? true,
        partners: project?.partnersEnabled ?? false,
      },
      earn_actions: actionsWithStatus,
      completed_actions: Array.from(completedSlugs),
      referral_levels: referralLevels.map((l: any) => ({
        level: l.level,
        points: l.points,
      })),
      partner_info: partnerInfo,
      pending_social_claims: pendingSocialClaims.map((c) => ({
        slug: c.actionSlug,
        initiated_at: c.initiatedAt.toISOString(),
      })),
    };
  }

  async getProjectPublicSettings(projectId: number) {
    const allSettings = await this.configService.getAll(projectId);
    const tiers = await this.configService.getRedemptionTiers(projectId);

    // Fall back to project domain if referral_base_url not configured
    let referralBaseUrl = allSettings.referral_base_url || '';
    if (!referralBaseUrl) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { domain: true },
      });
      if (project?.domain) {
        referralBaseUrl = project.domain.startsWith('http')
          ? project.domain
          : `https://${project.domain}`;
      }
    }

    return {
      tiers,
      referral_base_url: referralBaseUrl,
      social_tiktok_url: allSettings.social_tiktok_url || '',
      social_instagram_url: allSettings.social_instagram_url || '',
      widget_primary_color: allSettings.widget_primary_color || '#ff3c00',
      widget_bg_color: allSettings.widget_bg_color || '#f5f5f5',
      widget_text_color: allSettings.widget_text_color || '#1a1a1a',
      widget_brand_name: allSettings.widget_brand_name || '',
      referral_discount_percent: allSettings.referral_discount_percent || '5',
      gamification_enabled: allSettings.gamification_enabled || 'false',
      gamification_tiers: allSettings.gamification_tiers || '[]',
      shopify_domain: allSettings.shopify_domain || '',
      leaderboard_enabled: allSettings.leaderboard_enabled || 'false',
      social_follow_claim_delay: allSettings.social_follow_claim_delay || '30',
    };
  }

  async getProjectConfig(projectId: number) {
    const project = await this.getProject(projectId);

    const [settings, earnActions, redemptionTiers, referralLevels] = await Promise.all([
      this.getProjectPublicSettings(projectId),
      project?.pointsEnabled
        ? this.earnActionsService.getEnabledActions(projectId)
        : [],
      project?.pointsEnabled
        ? this.configService.getRedemptionTiers(projectId)
        : [],
      project?.referralsEnabled
        ? this.configService.getReferralLevels(projectId)
        : [],
    ]);

    return {
      settings,
      earn_actions: earnActions.map((a: any) => ({
        slug: a.slug,
        label: a.label,
        points: a.points,
        category: a.category,
        frequency: a.frequency,
      })),
      redemption_tiers: redemptionTiers,
      referral_levels: referralLevels.map((l: any) => ({
        level: l.level,
        points: l.points,
      })),
      enabled_modules: {
        points: project?.pointsEnabled ?? true,
        referrals: project?.referralsEnabled ?? true,
        partners: project?.partnersEnabled ?? false,
      },
    };
  }

  async getLeaderboard(projectId: number, limit = 10) {
    if (this.configService.get(projectId, 'leaderboard_enabled') !== 'true') {
      return [];
    }
    return this.customersService.getTopReferrers(projectId, limit);
  }

  generateCustomerToken(projectId: number, email: string): string {
    return this.jwtService.sign(
      { projectId, email, type: 'sdk_customer' },
      {
        secret: process.env.JWT_SECRET || 'dev-jwt-secret',
        expiresIn: '24h' as any,
      },
    );
  }

  verifyCustomerToken(token: string): { projectId: number; email: string } | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'dev-jwt-secret',
      });
      if (payload.type !== 'sdk_customer') return null;
      return { projectId: payload.projectId, email: payload.email };
    } catch {
      return null;
    }
  }
}
