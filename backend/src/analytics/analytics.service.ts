import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface PointsEconomyBucket {
  bucket: string;
  issued: number;
  redeemed: number;
}

export interface CustomerSegments {
  active: number;
  at_risk: number;
  churned: number;
}

export interface ReferralFunnelData {
  totalCustomers: number;
  referredSignups: number;
  referredPurchasers: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPointsEconomy(
    projectId: number,
    period: string = 'day',
    from?: string,
    to?: string,
  ): Promise<PointsEconomyBucket[]> {
    const trunc = period === 'week' ? 'week' : period === 'month' ? 'month' : 'day';
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const toDate = to ? new Date(to) : new Date();

    const rows = await this.prisma.$queryRaw<
      Array<{ bucket: Date; issued: bigint; redeemed: bigint }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${trunc}, created_at) AS bucket,
        COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) AS issued,
        COALESCE(SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END), 0) AS redeemed
      FROM points_log
      WHERE project_id = ${projectId}
        AND created_at >= ${fromDate}
        AND created_at <= ${toDate}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    return rows.map((r) => ({
      bucket: r.bucket.toISOString().split('T')[0],
      issued: Number(r.issued),
      redeemed: Number(r.redeemed),
    }));
  }

  async getReferralFunnel(
    projectId: number,
    from?: string,
    to?: string,
  ): Promise<ReferralFunnelData> {
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();

    const totalCustomers = await this.prisma.customer.count({
      where: { projectId, createdAt: { gte: fromDate, lte: toDate } },
    });

    const referredSignups = await this.prisma.customer.count({
      where: {
        projectId,
        referredBy: { not: null },
        createdAt: { gte: fromDate, lte: toDate },
      },
    });

    const referredPurchasers = await this.prisma.customer.count({
      where: {
        projectId,
        referredBy: { not: null },
        orderCount: { gt: 0 },
        createdAt: { gte: fromDate, lte: toDate },
      },
    });

    return { totalCustomers, referredSignups, referredPurchasers };
  }

  async getCustomerSegments(projectId: number): Promise<CustomerSegments> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const [active, at_risk, churned] = await Promise.all([
      this.prisma.customer.count({
        where: { projectId, lastActivity: { gte: thirtyDaysAgo } },
      }),
      this.prisma.customer.count({
        where: {
          projectId,
          lastActivity: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      this.prisma.customer.count({
        where: { projectId, lastActivity: { lt: ninetyDaysAgo } },
      }),
    ]);

    return { active, at_risk, churned };
  }

  async getSegmentCustomers(
    projectId: number,
    segment: string,
    limit = 50,
    offset = 0,
  ) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    let where: any = { projectId };
    if (segment === 'active') {
      where.lastActivity = { gte: thirtyDaysAgo };
    } else if (segment === 'at_risk') {
      where.lastActivity = { gte: ninetyDaysAgo, lt: thirtyDaysAgo };
    } else {
      where.lastActivity = { lt: ninetyDaysAgo };
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { lastActivity: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
        select: {
          id: true,
          email: true,
          name: true,
          pointsBalance: true,
          pointsEarnedTotal: true,
          orderCount: true,
          lastActivity: true,
          createdAt: true,
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        points_balance: c.pointsBalance,
        points_earned_total: c.pointsEarnedTotal,
        order_count: c.orderCount,
        last_activity: c.lastActivity,
        created_at: c.createdAt,
      })),
      total,
    };
  }

  async exportCustomersCsv(projectId: number): Promise<string> {
    const customers = await this.prisma.customer.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        referralCode: true,
        referredBy: true,
        pointsBalance: true,
        pointsEarnedTotal: true,
        orderCount: true,
        createdAt: true,
        lastActivity: true,
      },
    });

    const header = 'id,email,name,referral_code,referred_by,points_balance,points_earned_total,order_count,created_at,last_activity';
    const rows = customers.map((c) =>
      [
        c.id,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        c.referralCode,
        c.referredBy || '',
        c.pointsBalance,
        c.pointsEarnedTotal,
        c.orderCount,
        c.createdAt.toISOString(),
        c.lastActivity.toISOString(),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async exportPointsLogCsv(
    projectId: number,
    from?: string,
    to?: string,
  ): Promise<string> {
    const where: any = { projectId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const logs = await this.prisma.pointsLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerId: true,
        points: true,
        type: true,
        description: true,
        orderId: true,
        createdAt: true,
        customer: { select: { email: true } },
      },
    });

    const header = 'id,customer_id,customer_email,points,type,description,order_id,created_at';
    const rows = logs.map((l) =>
      [
        l.id,
        l.customerId,
        `"${(l.customer.email || '').replace(/"/g, '""')}"`,
        l.points,
        l.type,
        `"${(l.description || '').replace(/"/g, '""')}"`,
        l.orderId || '',
        l.createdAt.toISOString(),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
