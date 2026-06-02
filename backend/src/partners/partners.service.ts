import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
  ) {}

  async promoteToPartner(
    projectId: number,
    customerId: number,
    commissionPct: number,
    currency?: string,
  ) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.projectId !== projectId) throw new NotFoundException('Customer not found');
    if (customer.isPartner) throw new BadRequestException('Already a partner');

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const partnerCurrency = (currency || project?.baseCurrency || 'EUR').toUpperCase();

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { isPartner: true, partnerCommissionPct: commissionPct, partnerCurrency },
    });
  }

  async updateCurrency(projectId: number, customerId: number, currency: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.projectId !== projectId) throw new NotFoundException('Customer not found');
    if (!customer.isPartner) throw new BadRequestException('Customer is not a partner');

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { partnerCurrency: currency.toUpperCase() },
    });
  }

  async demotePartner(projectId: number, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.projectId !== projectId) throw new NotFoundException('Customer not found');

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { isPartner: false, partnerCommissionPct: null, partnerCurrency: null },
    });
  }

  async updateCommission(projectId: number, customerId: number, commissionPct: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.projectId !== projectId) throw new NotFoundException('Customer not found');
    if (!customer.isPartner) throw new BadRequestException('Customer is not a partner');

    return this.prisma.customer.update({
      where: { id: customerId },
      data: { partnerCommissionPct: commissionPct },
    });
  }

  async awardCommission(
    projectId: number,
    partnerId: number,
    customerId: number,
    orderId: string,
    orderTotal: number,
    orderCurrency?: string,
  ) {
    const partner = await this.prisma.customer.findUnique({ where: { id: partnerId } });
    if (!partner || !partner.isPartner || !partner.partnerCommissionPct) return null;

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const baseCurrency = (project?.baseCurrency || 'EUR').toUpperCase();
    const resolvedOrderCurrency = (orderCurrency || baseCurrency).toUpperCase();
    const partnerCurrency = (partner.partnerCurrency || baseCurrency).toUpperCase();

    const commissionPct = Number(partner.partnerCommissionPct);
    const rewardType = this.configService.get(projectId, 'partner_reward_type') || 'points';

    // Currency mismatch: record the attempt but skip the credit. Admin can resolve manually.
    if (resolvedOrderCurrency !== partnerCurrency) {
      this.logger.warn(
        `Partner ${partnerId} commission skipped for order ${orderId}: order in ${resolvedOrderCurrency} but partner is ${partnerCurrency}`,
      );
      return this.prisma.partnerEarning.create({
        data: {
          projectId,
          partnerId,
          customerId,
          orderId,
          orderTotal,
          orderCurrency: resolvedOrderCurrency,
          partnerCurrency,
          commissionPct,
          amountEarned: 0,
          rewardType,
          status: 'skipped_currency',
          skippedReason: `Order currency ${resolvedOrderCurrency} does not match partner currency ${partnerCurrency}`,
        },
      });
    }

    const amountEarned = Math.round(orderTotal * commissionPct) / 100;

    const earning = await this.prisma.partnerEarning.create({
      data: {
        projectId,
        partnerId,
        customerId,
        orderId,
        orderTotal,
        orderCurrency: resolvedOrderCurrency,
        partnerCurrency,
        commissionPct,
        amountEarned,
        rewardType,
      },
    });

    if (rewardType === 'credit') {
      await this.prisma.customer.update({
        where: { id: partnerId },
        data: { partnerCreditBalance: { increment: amountEarned } },
      });
    } else {
      // Convert to points (1:1 mapping, rounded)
      const pointsEquiv = Math.round(amountEarned);
      if (pointsEquiv > 0) {
        await this.prisma.$transaction([
          this.prisma.pointsLog.create({
            data: {
              projectId,
              customerId: partnerId,
              points: pointsEquiv,
              type: 'partner_commission',
              description: `Partner commission on order #${orderId}`,
              orderId,
            },
          }),
          this.prisma.customer.update({
            where: { id: partnerId },
            data: {
              pointsBalance: { increment: pointsEquiv },
              pointsEarnedTotal: { increment: pointsEquiv },
              lastActivity: new Date(),
            },
          }),
        ]);
      }
    }

    return earning;
  }

  async getPartnerEarnings(projectId: number, partnerId: number) {
    return this.prisma.partnerEarning.findMany({
      where: { projectId, partnerId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listPartners(projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const baseCurrency = (project?.baseCurrency || 'EUR').toUpperCase();

    const partners = await this.prisma.customer.findMany({
      where: { projectId, isPartner: true },
      select: {
        id: true,
        name: true,
        email: true,
        partnerCommissionPct: true,
        partnerCurrency: true,
        partnerCreditBalance: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Total earned only counts awarded rows; skipped_currency rows are excluded.
    const partnerIds = partners.map((p) => p.id);
    const earningsAgg = await this.prisma.partnerEarning.groupBy({
      by: ['partnerId'],
      where: { projectId, partnerId: { in: partnerIds }, status: 'awarded' },
      _sum: { amountEarned: true },
      _count: true,
    });

    const earningsMap = new Map<number, { total: number; count: number }>();
    for (const e of earningsAgg) {
      earningsMap.set(e.partnerId, {
        total: Number(e._sum.amountEarned || 0),
        count: e._count,
      });
    }

    return partners.map((p) => {
      const earnings = earningsMap.get(p.id) || { total: 0, count: 0 };
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        commission_pct: Number(p.partnerCommissionPct || 0),
        currency: (p.partnerCurrency || baseCurrency).toUpperCase(),
        credit_balance: Number(p.partnerCreditBalance || 0),
        total_earned: earnings.total,
        total_orders: earnings.count,
        created_at: p.createdAt,
      };
    });
  }

  async getPartnerInfo(projectId: number, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.isPartner) return null;

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const baseCurrency = (project?.baseCurrency || 'EUR').toUpperCase();

    const earnings = await this.prisma.partnerEarning.aggregate({
      where: { projectId, partnerId: customerId, status: 'awarded' },
      _sum: { amountEarned: true },
      _count: true,
    });

    return {
      commission_pct: Number(customer.partnerCommissionPct || 0),
      currency: (customer.partnerCurrency || baseCurrency).toUpperCase(),
      credit_balance: Number(customer.partnerCreditBalance || 0),
      total_earned: Number(earnings._sum.amountEarned || 0),
      total_orders: earnings._count,
    };
  }
}
