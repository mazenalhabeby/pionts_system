import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { CustomersService } from '../customers/customers.service';
import { PlatformFactory } from '../platforms/platform.factory';
import { toSnakeCaseRedemption } from '../utils/transformers';

@Injectable()
export class RedemptionsService {
  private readonly logger = new Logger(RedemptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
    private readonly customersService: CustomersService,
    private readonly platformFactory: PlatformFactory,
  ) {}

  async getCustomerRedemptions(projectId: number, customerId: number) {
    const redemptions = await this.prisma.redemption.findMany({
      where: { projectId, customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        pointsSpent: true,
        discountAmount: true,
        discountCode: true,
        used: true,
        createdAt: true,
      },
    });
    return redemptions.map(toSnakeCaseRedemption);
  }

  /** Validates tier exists and customer has enough points. */
  private async validateTier(projectId: number, customerBalance: number, tierPoints: number) {
    const tiers = await this.configService.getRedemptionTiers(projectId);
    const tier = tiers.find((t) => t.points === tierPoints);
    if (!tier) throw new BadRequestException('Invalid tier');
    if (customerBalance < tier.points) throw new BadRequestException('Not enough points');
    return tier;
  }

  /** Deducts points and creates the redemption record. */
  private async executeRedemption(
    projectId: number,
    customerId: number,
    tier: { points: number; discount: number },
    code: string,
  ) {
    const newBalance = await this.customersService.deductPoints(
      projectId, customerId, tier.points, 'redeem', `Redeemed €${tier.discount} off`,
    );

    await this.prisma.redemption.create({
      data: {
        projectId,
        customerId,
        pointsSpent: tier.points,
        discountAmount: tier.discount,
        discountCode: code,
      },
    });

    return { newBalance };
  }

  private async getCodePrefix(projectId: number): Promise<string> {
    const configured = this.configService.get(projectId, 'discount_code_prefix');
    if (configured) return configured.toUpperCase();

    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
    const name = project?.name || 'REWARD';
    return name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  }

  async redeemGeneric(projectId: number, customer: { id: number; pointsBalance: number; referralCode: string }, tierPoints: number) {
    const tier = await this.validateTier(projectId, customer.pointsBalance, tierPoints);
    const prefix = await this.getCodePrefix(projectId);
    const code = `${prefix}-${customer.referralCode}-${Date.now().toString(36)}`;

    // Create discount on the project's platform via adapter
    const config = await this.platformFactory.getConfig(projectId);
    const adapter = this.platformFactory.getAdapter(config.platform);
    const result = await adapter.createDiscount(config, code, tier.discount);
    const { newBalance } = await this.executeRedemption(projectId, customer.id, tier, code);

    // Notify platform via webhook (fire-and-forget)
    this.notifyPlatformWebhook(projectId, 'redemption.created', code, tier.discount).catch(() => {});

    return {
      discount_code: code,
      discount_amount: tier.discount,
      new_balance: newBalance,
      platform_created: result.success,
    };
  }

  private async deletePlatformDiscount(projectId: number, code: string): Promise<boolean> {
    try {
      const config = await this.platformFactory.getConfig(projectId);
      const adapter = this.platformFactory.getAdapter(config.platform);
      return await adapter.deleteDiscount(config, code);
    } catch (err) {
      this.logger.error(`Failed to delete platform discount for project ${projectId}:`, err);
      return false;
    }
  }

  async cancelRedemption(projectId: number, customerId: number, redemptionId: number) {
    const redemption = await this.prisma.redemption.findFirst({
      where: { id: redemptionId, projectId, customerId },
    });
    if (!redemption) throw new BadRequestException('Redemption not found');
    if (redemption.used) throw new BadRequestException('Cannot cancel a used discount code');

    const newBalance = await this.customersService.awardPoints(
      projectId, customerId, redemption.pointsSpent, 'refund', `Cancelled €${redemption.discountAmount} discount code`,
    );

    // Delete the discount code from the platform
    await this.deletePlatformDiscount(projectId, redemption.discountCode);

    await this.prisma.redemption.delete({ where: { id: redemptionId } });

    // Notify platform via webhook (fire-and-forget)
    this.notifyPlatformWebhook(projectId, 'redemption.cancelled', redemption.discountCode, Number(redemption.discountAmount)).catch(() => {});

    return { points_returned: redemption.pointsSpent, new_balance: newBalance };
  }

  /**
   * Notify the platform's webhook endpoint about redemption events.
   * The platform creates/deletes discount codes on their side.
   */
  private async notifyPlatformWebhook(projectId: number, event: string, code: string, amount: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { platformApiUrl: true, hmacSecret: true },
    });

    if (!project?.platformApiUrl) return;

    const webhookUrl = `${project.platformApiUrl}/loyalty/webhook/redemption`;

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': project.hmacSecret || '',
        },
        body: JSON.stringify({ event, code, amount }),
      });

      if (!res.ok) {
        this.logger.warn(`Platform webhook failed (${res.status}): ${event} ${code}`);
      }
    } catch (err: any) {
      this.logger.warn(`Platform webhook error: ${err.message}`);
    }
  }
}
