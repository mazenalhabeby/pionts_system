import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { CustomersService } from '../customers/customers.service';
import { ShopifyService } from '../shopify/shopify.service';
import { toSnakeCaseRedemption } from '../utils/transformers';

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
    private readonly customersService: CustomersService,
    private readonly shopifyService: ShopifyService,
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
    const { newBalance } = await this.executeRedemption(projectId, customer.id, tier, code);

    return {
      discount_code: code,
      discount_amount: tier.discount,
      new_balance: newBalance,
    };
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

    await this.prisma.redemption.delete({ where: { id: redemptionId } });

    return { points_returned: redemption.pointsSpent, new_balance: newBalance };
  }

  async redeem(projectId: number, customer: { id: number; pointsBalance: number; referralCode: string }, tierPoints: number) {
    const tier = await this.validateTier(projectId, customer.pointsBalance, tierPoints);
    const prefix = await this.getCodePrefix(projectId);
    const code = `${prefix}-${customer.referralCode}-${Date.now()}`;
    const shopifyCreated = await this.shopifyService.createDiscount(code, tier.discount);
    const { newBalance } = await this.executeRedemption(projectId, customer.id, tier, code);

    return {
      discount_code: code,
      discount_amount: tier.discount,
      new_balance: newBalance,
      shopify_created: shopifyCreated,
    };
  }
}
