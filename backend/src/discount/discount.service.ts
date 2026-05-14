import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(projectId: number, code: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { discountCode: code.toLowerCase() },
    });

    if (!redemption || redemption.projectId !== projectId) {
      return { valid: false };
    }

    return {
      valid: true,
      discount_amount: Number(redemption.discountAmount),
      already_used: redemption.used,
    };
  }

  async markUsed(projectId: number, code: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { discountCode: code.toLowerCase() },
    });

    if (!redemption || redemption.projectId !== projectId) {
      return { success: false };
    }

    if (!redemption.used) {
      await this.prisma.redemption.update({
        where: { id: redemption.id },
        data: { used: true },
      });
    }

    return { success: true };
  }

  /**
   * Mark a discount code as used with partial amount.
   * If the actual amount used is less than the discount value,
   * the unused portion is converted back to points and returned to the customer.
   *
   * Example: Customer redeems 500 points for €50 code, but order is only €40.
   * → €40 used, €10 unused → 100 points returned to customer.
   */
  async markUsedPartial(projectId: number, code: string, actualAmountUsed: number) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { discountCode: code.toLowerCase() },
      include: { customer: { select: { id: true, pointsBalance: true } } },
    });

    if (!redemption || redemption.projectId !== projectId) {
      return { success: false };
    }

    if (redemption.used) {
      return { success: true, points_returned: 0 };
    }

    const fullAmount = Number(redemption.discountAmount);
    const used = Math.min(actualAmountUsed, fullAmount);
    const unused = fullAmount - used;

    // Mark as used
    await this.prisma.redemption.update({
      where: { id: redemption.id },
      data: { used: true, discountAmount: used },
    });

    // Return unused points proportionally
    let pointsReturned = 0;
    if (unused > 0 && fullAmount > 0) {
      const ratio = unused / fullAmount;
      pointsReturned = Math.round(redemption.pointsSpent * ratio);

      if (pointsReturned > 0) {
        // Return points to customer
        await this.prisma.customer.update({
          where: { id: redemption.customerId },
          data: { pointsBalance: { increment: pointsReturned } },
        });

        // Log the points return
        await this.prisma.pointsLog.create({
          data: {
            projectId,
            customerId: redemption.customerId,
            points: pointsReturned,
            type: 'refund',
            description: `Partial redemption refund: €${unused.toFixed(2)} unused from code ${code}`,
          },
        });
      }
    }

    return { success: true, amount_used: used, amount_unused: unused, points_returned: pointsReturned };
  }
}
