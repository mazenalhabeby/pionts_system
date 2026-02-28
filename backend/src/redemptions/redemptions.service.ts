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

  async redeemGeneric(projectId: number, customer: { id: number; pointsBalance: number; referralCode: string }, tierPoints: number) {
    const tier = await this.validateTier(projectId, customer.pointsBalance, tierPoints);
    const code = `PIONTS-${customer.referralCode}-${Date.now().toString(36)}`;
    const { newBalance } = await this.executeRedemption(projectId, customer.id, tier, code);

    return {
      discount_code: code,
      discount_amount: tier.discount,
      new_balance: newBalance,
    };
  }

  async redeem(projectId: number, customer: { id: number; pointsBalance: number; referralCode: string }, tierPoints: number) {
    const tier = await this.validateTier(projectId, customer.pointsBalance, tierPoints);
    const code = `8BC-${customer.referralCode}-${Date.now()}`;
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
