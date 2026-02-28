import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(projectId: number, code: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { discountCode: code },
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
      where: { discountCode: code },
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
}
