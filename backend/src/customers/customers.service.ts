import { Injectable, NotFoundException, Optional, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralCodeService } from '../utils/referral-code.service';
import { NotificationService } from '../notifications/notification.service';
import { BillingService } from '../billing/billing.service';
import { AppConfigService } from '../config/app-config.service';
import { Prisma } from '@prisma/client';
import { toSnakeCaseLog } from '../utils/transformers';

/** Canonical snake_case flag → Prisma camelCase field map */
export const FLAG_MAP: Record<string, string> = {
  signup_rewarded: 'signupRewarded',
  first_order_rewarded: 'firstOrderRewarded',
  followed_tiktok: 'followedTiktok',
  followed_instagram: 'followedInstagram',
};

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referralCodeService: ReferralCodeService,
    private readonly appConfigService: AppConfigService,
    @Optional() private readonly notificationService?: NotificationService,
    @Optional() private readonly billingService?: BillingService,
  ) {}

  /** Returns the tier multiplier for a customer based on their total earned points. */
  getTierMultiplier(projectId: number, totalEarned: number): number {
    if (this.appConfigService.get(projectId, 'gamification_enabled') !== 'true') return 1;

    const tiers = this.appConfigService.getGamificationTiers(projectId)
      .sort((a, b) => b.threshold - a.threshold);

    for (const tier of tiers) {
      if (totalEarned >= tier.threshold) return tier.multiplier;
    }
    return 1;
  }

  /**
   * Resolves a customer from an express session.
   * Eliminates repeated email-lookup-or-throw pattern in controllers.
   */
  async resolveFromSession(projectId: number, session: any) {
    const email = session?.customerEmail;
    if (!email) throw new NotFoundException('Customer not found');
    const customer = await this.findByEmail(projectId, email);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async findByEmail(projectId: number, email: string) {
    return this.prisma.customer.findUnique({
      where: { projectId_email: { projectId, email } },
    });
  }

  async findById(projectId: number, id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer && customer.projectId !== projectId) return null;
    return customer;
  }

  async findByReferralCode(projectId: number, code: string) {
    return this.prisma.customer.findUnique({
      where: { projectId_referralCode: { projectId, referralCode: code } },
    });
  }

  async getOrCreate(projectId: number, email: string, name?: string, shopifyId?: string) {
    let customer = await this.findByEmail(projectId, email);

    if (customer) {
      const updates: any = {};
      if (shopifyId && !customer.shopifyCustomerId) updates.shopifyCustomerId = shopifyId;
      if (name && !customer.name) updates.name = name;
      if (Object.keys(updates).length > 0) {
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: updates,
        });
      }
      return customer;
    }

    // Check billing limits before creating
    if (this.billingService) {
      await this.billingService.canCreateCustomer(projectId);
    }

    const code = await this.referralCodeService.generate(projectId);
    return this.prisma.customer.create({
      data: {
        projectId,
        email,
        name: name || '',
        shopifyCustomerId: shopifyId || null,
        referralCode: code,
      },
    });
  }

  /** Awards points and returns the updated points balance. */
  async awardPoints(projectId: number, customerId: number, points: number, type: string, description: string, orderId?: string): Promise<number> {
    const [, updated] = await this.prisma.$transaction([
      this.prisma.pointsLog.create({
        data: {
          projectId,
          customerId,
          points,
          type,
          description,
          orderId: orderId || null,
        },
      }),
      this.prisma.customer.update({
        where: { id: customerId },
        data: {
          pointsBalance: { increment: points },
          pointsEarnedTotal: { increment: points },
          lastActivity: new Date(),
        },
      }),
    ]);

    // Send points earned notification (fire-and-forget)
    if (this.notificationService && type !== 'signup') {
      this.notificationService
        .onPointsEarned(projectId, updated, points, type, updated.pointsBalance)
        .catch((err) => this.logger.error('Notification failed', err?.message));
    }

    return updated.pointsBalance;
  }

  /** Deducts points and returns the updated points balance. */
  async deductPoints(projectId: number, customerId: number, points: number, type: string, description: string, orderId?: string): Promise<number> {
    const [, updated] = await this.prisma.$transaction([
      this.prisma.pointsLog.create({
        data: {
          projectId,
          customerId,
          points: -points,
          type,
          description,
          orderId: orderId || null,
        },
      }),
      this.prisma.customer.update({
        where: { id: customerId },
        data: {
          pointsBalance: { decrement: points },
          lastActivity: new Date(),
        },
      }),
    ]);
    return updated.pointsBalance;
  }

  async setFlag(customerId: number, flag: string) {
    const prismaField = FLAG_MAP[flag];
    if (!prismaField) return;
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { [prismaField]: true },
    });
  }

  /** Checks if a flag is already set. Uses the shared FLAG_MAP. */
  isFlagSet(customer: any, flag: string): boolean {
    const prismaField = FLAG_MAP[flag];
    return prismaField ? !!(customer as any)[prismaField] : false;
  }

  async ensureSignupRewarded(projectId: number, customerId: number, signupPoints: number) {
    await this.awardPoints(projectId, customerId, signupPoints, 'signup', 'Welcome to 8BC Crew!');
    await this.setFlag(customerId, 'signup_rewarded');

    // Send welcome email
    if (this.notificationService) {
      const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        this.notificationService.onCustomerSignup(projectId, customer, signupPoints).catch((err) => this.logger.error('Notification failed', err?.message));
      }
    }
  }

  async setBirthdayYear(customerId: number, year: number) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { birthdayRewardedYear: year },
    });
  }

  async setBirthday(customerId: number, birthday: string) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { birthday },
    });
  }

  async incrementOrderCount(customerId: number) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { orderCount: { increment: 1 } },
    });
  }

  async saveVerificationCode(customerId: number, code: string, expiry: string) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { verificationCode: code, verificationExpiry: expiry },
    });
  }

  async clearVerificationCode(customerId: number) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { verificationCode: null, verificationExpiry: null, emailVerified: true },
    });
  }

  async setReferredBy(customerId: number, code: string) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { referredBy: code },
    });
  }

  async getHistory(projectId: number, customerId: number, limit = 20, offset = 0) {
    limit = Math.min(limit, 100);
    const logs = await this.prisma.pointsLog.findMany({
      where: { projectId, customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        points: true,
        type: true,
        description: true,
        orderId: true,
        createdAt: true,
      },
    });
    return logs.map(toSnakeCaseLog);
  }

  async searchCustomers(projectId: number, query?: string, sort?: string, dir?: string, limit = 50, offset = 0) {
    limit = Math.min(limit, 200);
    const sortMap: Record<string, string> = {
      id: 'id',
      email: 'email',
      name: 'name',
      points_balance: 'pointsBalance',
      pointsBalance: 'pointsBalance',
      points_earned_total: 'pointsEarnedTotal',
      pointsEarnedTotal: 'pointsEarnedTotal',
      order_count: 'orderCount',
      orderCount: 'orderCount',
    };
    const sortCol = (sort && sortMap[sort]) || 'id';
    const sortDir = dir === 'asc' ? 'asc' : 'desc';

    const where: any = { projectId };
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { [sortCol]: sortDir },
        take: limit,
        skip: offset,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async getStats(projectId: number) {
    const [totalCustomers, pointsAgg, totalOrders, redeemAgg] = await Promise.all([
      this.prisma.customer.count({ where: { projectId } }),
      this.prisma.customer.aggregate({ where: { projectId }, _sum: { pointsEarnedTotal: true } }),
      this.prisma.processedOrder.count({ where: { projectId } }),
      this.prisma.redemption.aggregate({ where: { projectId }, _sum: { discountAmount: true } }),
    ]);

    return {
      totalCustomers,
      totalPoints: pointsAgg._sum.pointsEarnedTotal || 0,
      totalOrders,
      totalRedeemed: redeemAgg._sum.discountAmount || 0,
    };
  }

  async getRecentActivity(projectId: number, limit = 20) {
    const logs = await this.prisma.pointsLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        points: true,
        type: true,
        description: true,
        createdAt: true,
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return logs.map((l) => ({
      points: l.points,
      type: l.type,
      description: l.description,
      created_at: l.createdAt,
      name: l.customer.name,
      email: l.customer.email,
      customer_id: l.customer.id,
    }));
  }

  async getPointsBreakdown(projectId: number, customerId: number) {
    const results = await this.prisma.$queryRaw<Array<{ type: string; total: bigint }>>(Prisma.sql`
      SELECT type, SUM(points) as total
      FROM points_log
      WHERE project_id = ${projectId} AND customer_id = ${customerId} AND points > 0
      GROUP BY type
      ORDER BY total DESC
    `);
    return results.map((r) => ({
      type: r.type,
      total: Number(r.total),
    }));
  }

  async getCustomerRedemptionStats(projectId: number, customerId: number) {
    const [redeemAgg, unusedCount] = await Promise.all([
      this.prisma.redemption.aggregate({
        where: { projectId, customerId },
        _sum: { discountAmount: true },
        _count: true,
      }),
      this.prisma.redemption.count({
        where: { projectId, customerId, used: false },
      }),
    ]);
    return {
      total_redeemed: redeemAgg._sum.discountAmount || 0,
      total_codes: redeemAgg._count,
      unused_codes: unusedCount,
    };
  }

  async getTopReferrers(projectId: number, limit = 10) {
    // Count direct referrals for each customer (those who referred at least one person)
    const results = await this.prisma.$queryRaw<Array<any>>(Prisma.sql`
      SELECT
        c.id, c.name, c.email, c.points_earned_total,
        COUNT(DISTINCT d.id) as direct
      FROM customers c
      INNER JOIN referral_tree d ON d.parent_id = c.id AND d.project_id = ${projectId}
      WHERE c.project_id = ${projectId}
      GROUP BY c.id, c.name, c.email, c.points_earned_total
      ORDER BY direct DESC
      LIMIT ${limit}
    `);

    return results.map((r) => ({
      id: Number(r.id),
      name: r.name,
      email: r.email,
      points_earned_total: Number(r.points_earned_total),
      direct: Number(r.direct),
      network: Number(r.direct), // network count requires recursive query; use direct as approximation in leaderboard
    }));
  }
}
