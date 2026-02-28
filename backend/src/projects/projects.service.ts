import { Injectable, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyService } from '../auth/api-key.service';
import { AppConfigService } from '../config/app-config.service';
import { EarnActionsService } from '../earn-actions/earn-actions.service';
import { BillingService } from '../billing/billing.service';
import { DEFAULT_TIERS, DEFAULT_LEVELS } from '../common/constants/defaults';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyService: ApiKeyService,
    private readonly configService: AppConfigService,
    private readonly earnActionsService: EarnActionsService,
    @Optional() private readonly billingService?: BillingService,
  ) {}

  async create(
    orgId: number,
    name: string,
    domain?: string,
    platform?: string,
    userId?: number,
    userRole?: string,
    modules?: { pointsEnabled?: boolean; referralsEnabled?: boolean; partnersEnabled?: boolean },
  ) {
    if (this.billingService) {
      await this.billingService.canCreateProject(orgId);
    }
    const hmacSecret = crypto.randomBytes(32).toString('hex');
    const project = await this.prisma.project.create({
      data: {
        orgId,
        name,
        domain: domain || null,
        platform: platform || 'custom',
        hmacSecret,
        pointsEnabled: modules?.pointsEnabled ?? true,
        referralsEnabled: modules?.referralsEnabled ?? true,
        partnersEnabled: modules?.partnersEnabled ?? false,
      },
    });

    const keys = await this.apiKeyService.generateKeyPair(project.id);
    await this.configService.loadSettingsForProject(project.id);

    // Seed default earn actions
    await this.earnActionsService.seedDefaultActions(project.id);

    // Seed default redemption tiers
    await this.prisma.redemptionTier.createMany({
      data: DEFAULT_TIERS.map((t) => ({ projectId: project.id, ...t })),
    });

    // Seed default referral levels
    await this.prisma.referralLevel.createMany({
      data: DEFAULT_LEVELS.map((l) => ({ projectId: project.id, ...l })),
    });

    // Auto-create ProjectMember(owner) for the project creator
    if (userId) {
      await this.prisma.projectMember.create({
        data: { projectId: project.id, userId, role: 'owner' },
      });
    }

    return { project, keys };
  }

  async list(orgId: number, userId?: number, userRole?: string) {
    const where: any = { orgId, status: { not: 'archived' } };

    // Non-owner users only see projects they're a member of
    if (userId && userRole && userRole !== 'owner') {
      where.members = { some: { userId } };
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        _count: { select: { customers: true, apiKeys: true } },
        ...(userId
          ? { members: { where: { userId }, select: { role: true } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  async findById(id: number) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async update(id: number, data: {
    name?: string;
    domain?: string;
    status?: string;
    pointsEnabled?: boolean;
    referralsEnabled?: boolean;
    partnersEnabled?: boolean;
  }) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async archive(id: number) {
    return this.prisma.project.update({
      where: { id },
      data: { status: 'archived' },
    });
  }
}
