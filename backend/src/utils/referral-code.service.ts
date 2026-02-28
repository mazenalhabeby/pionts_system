import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class ReferralCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(projectId: number): Promise<string> {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += CHARS[crypto.randomInt(CHARS.length)];
      }
      const existing = await this.prisma.customer.findUnique({
        where: { projectId_referralCode: { projectId, referralCode: code } },
      });
      if (!existing) break;
    } while (true);
    return code;
  }
}
