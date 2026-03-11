import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { CustomersService } from '../customers/customers.service';
import { ReferralsService } from '../referrals/referrals.service';
import { EarnActionsService } from '../earn-actions/earn-actions.service';
import { PartnersService } from '../partners/partners.service';
import { extractName } from '../utils/transformers';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
    private readonly customersService: CustomersService,
    private readonly referralsService: ReferralsService,
    private readonly earnActionsService: EarnActionsService,
    private readonly partnersService: PartnersService,
  ) {}

  async processOrder(projectId: number, body: any) {
    const email = body.customer_email || body.customer?.email || body.email;
    if (!email) throw new BadRequestException('No customer email in order payload');

    const name = body.customer_name || extractName(body.customer?.first_name, body.customer?.last_name);
    const orderId = body.order_id || String(body.id || body.order_number);
    const orderTotal = body.order_total ?? parseFloat(body.total_price || body.subtotal_price || '0');
    const externalCustomerId = body.external_customer_id || (body.customer?.id ? String(body.customer.id) : undefined);
    const referralCode = body.referral_code;

    // Atomic dedup
    try {
      await this.prisma.processedOrder.create({ data: { projectId, orderId } });
    } catch (e: any) {
      if (e.code === 'P2002') return { status: 'already_processed' };
      throw e;
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new BadRequestException('Project not found');

    const customer = await this.customersService.getOrCreate(projectId, email, name, externalCustomerId);

    // Link referral if code provided and referrals are enabled
    if (referralCode && !customer.referredBy && project.referralsEnabled) {
      await this.referralsService.linkReferral(projectId, customer.id, referralCode);
    }

    await this.customersService.incrementOrderCount(customer.id);

    // Parse order total early (needed for dynamic purchase points + referral threshold)
    const parsedTotal = typeof orderTotal === 'number' ? orderTotal : parseFloat(orderTotal || '0');

    // Points awarding (only if points module enabled)
    if (project.pointsEnabled) {
      const purchaseAction = await this.earnActionsService.getAction(projectId, 'purchase');
      if (purchaseAction?.enabled) {
        const purchasePoints = purchaseAction.pointsMode === 'per_amount'
          ? Math.floor(parsedTotal * purchaseAction.points)
          : purchaseAction.points;
        if (purchasePoints > 0) {
          await this.customersService.awardPoints(
            projectId, customer.id, purchasePoints, 'purchase',
            `Purchase — Order #${orderId}`, orderId,
          );
        }
      }

      const firstOrderAction = await this.earnActionsService.getAction(projectId, 'first_order');
      if (firstOrderAction?.enabled) {
        const done = await this.earnActionsService.hasCompleted(projectId, customer.id, 'first_order');
        if (!done) {
          await this.customersService.awardPoints(
            projectId, customer.id, firstOrderAction.points, 'first_order',
            'First order bonus!', orderId,
          );
          await this.earnActionsService.markCompleted(projectId, customer.id, 'first_order');
        }
      }

      const signupAction = await this.earnActionsService.getAction(projectId, 'signup');
      if (signupAction?.enabled) {
        const done = await this.earnActionsService.hasCompleted(projectId, customer.id, 'signup');
        if (!done) {
          await this.customersService.awardPoints(
            projectId, customer.id, signupAction.points, 'signup', 'Welcome bonus!',
          );
          await this.earnActionsService.markCompleted(projectId, customer.id, 'signup');
        }
      }
    }

    // Referral rewards (only if referrals module enabled)
    if (project.referralsEnabled && !isNaN(parsedTotal) && parsedTotal >= this.configService.getInt(projectId, 'min_order_referral')) {
      const tree = await this.referralsService.getTreeEntry(projectId, customer.id);
      if (tree) {
        const levels = await this.configService.getReferralLevels(projectId);
        const maxLevel = levels.length > 0 ? Math.max(...levels.map((l) => l.level)) : 0;
        const upline = await this.referralsService.walkUpline(projectId, customer.id, maxLevel);

        for (const ancestor of upline) {
          const levelConfig = levels.find((l) => l.level === ancestor.level);
          if (!levelConfig || levelConfig.points <= 0) continue;

          // Check if this ancestor is a partner (direct parent only, level 2)
          if (project.partnersEnabled && ancestor.level === 2) {
            const referrer = await this.prisma.customer.findUnique({ where: { id: ancestor.customerId } });
            if (referrer?.isPartner) {
              // Partner gets commission INSTEAD OF regular referral points
              await this.partnersService.awardCommission(
                projectId, ancestor.customerId, customer.id, orderId, parsedTotal,
              );
              continue;
            }
          }

          await this.customersService.awardPoints(
            projectId, ancestor.customerId, levelConfig.points,
            `referral_l${ancestor.level}`,
            `${ancestor.level === 2 ? 'Crew' : 'Network'} referral: ${customer.name || email} ordered`,
            orderId,
          );
        }
      }
    }

    return { status: 'processed' };
  }

  async processCustomer(projectId: number, body: any) {
    const email = body.customer_email || body.email;
    if (!email) throw new BadRequestException('No email');

    const name = body.customer_name || extractName(body.first_name, body.last_name);
    const externalCustomerId = body.external_customer_id || (body.id ? String(body.id) : undefined);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const customer = await this.customersService.getOrCreate(projectId, email, name, externalCustomerId);

    if (project?.pointsEnabled) {
      const signupAction = await this.earnActionsService.getAction(projectId, 'signup');
      if (signupAction?.enabled) {
        const done = await this.earnActionsService.hasCompleted(projectId, customer.id, 'signup');
        if (!done) {
          await this.customersService.awardPoints(
            projectId, customer.id, signupAction.points, 'signup', 'Welcome bonus!',
          );
          await this.earnActionsService.markCompleted(projectId, customer.id, 'signup');
        }
      }
    }

    return { status: 'processed' };
  }

  async processRefund(projectId: number, body: any) {
    const orderId = body.order_id || String(body.order_id || body.id);

    const entries = await this.prisma.pointsLog.findMany({
      where: { projectId, orderId, points: { gt: 0 } },
    });

    if (entries.length > 0) {
      const ops = entries.flatMap((entry) => [
        this.prisma.pointsLog.create({
          data: {
            projectId,
            customerId: entry.customerId,
            points: -entry.points,
            type: 'clawback',
            description: `Clawback: ${entry.description} (refund)`,
            orderId,
          },
        }),
        this.prisma.customer.update({
          where: { id: entry.customerId },
          data: {
            pointsBalance: { decrement: entry.points },
            lastActivity: new Date(),
          },
        }),
      ]);
      await this.prisma.$transaction(ops);
    }

    return { status: 'processed', clawbacks: entries.length };
  }
}
