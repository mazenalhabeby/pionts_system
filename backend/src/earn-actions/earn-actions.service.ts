import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Default earn actions seeded on project creation (social follows added by admin with URL) */
const DEFAULT_ACTIONS = [
  { slug: 'signup', label: 'Sign up', points: 20, category: 'predefined', frequency: 'one_time', sortOrder: 0 },
  { slug: 'purchase', label: 'Every purchase', points: 10, category: 'predefined', frequency: 'repeatable', sortOrder: 1 },
  { slug: 'first_order', label: 'First order bonus', points: 50, category: 'predefined', frequency: 'one_time', sortOrder: 2 },
  { slug: 'review_photo', label: 'Photo review', points: 12, category: 'predefined', frequency: 'repeatable', sortOrder: 3 },
  { slug: 'review_text', label: 'Text review', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 4 },
  { slug: 'share_product', label: 'Share a product', points: 5, category: 'predefined', frequency: 'repeatable', sortOrder: 5 },
  { slug: 'birthday', label: 'Birthday bonus', points: 25, category: 'predefined', frequency: 'yearly', sortOrder: 6 },
];

@Injectable()
export class EarnActionsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaultActions(projectId: number) {
    await this.prisma.earnAction.createMany({
      data: DEFAULT_ACTIONS.map((a) => ({ projectId, ...a })),
      skipDuplicates: true,
    });
  }

  async getActions(projectId: number) {
    return this.prisma.earnAction.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getEnabledActions(projectId: number) {
    return this.prisma.earnAction.findMany({
      where: { projectId, enabled: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAction(projectId: number, slug: string) {
    return this.prisma.earnAction.findUnique({
      where: { projectId_slug: { projectId, slug } },
    });
  }

  async createAction(projectId: number, data: {
    slug: string;
    label: string;
    points: number;
    category?: string;
    frequency?: string;
    socialUrl?: string;
    sortOrder?: number;
  }) {
    return this.prisma.earnAction.create({
      data: {
        projectId,
        slug: data.slug,
        label: data.label,
        points: data.points,
        category: data.category || 'custom',
        frequency: data.frequency || 'one_time',
        socialUrl: data.socialUrl,
        sortOrder: data.sortOrder ?? 99,
      },
    });
  }

  async updateAction(projectId: number, id: number, data: {
    label?: string;
    points?: number;
    enabled?: boolean;
    socialUrl?: string;
    sortOrder?: number;
    frequency?: string;
  }) {
    return this.prisma.earnAction.update({
      where: { id, projectId },
      data,
    });
  }

  async deleteAction(projectId: number, id: number) {
    const action = await this.prisma.earnAction.findUnique({ where: { id } });
    if (!action || action.projectId !== projectId) return false;
    if (action.category !== 'custom' && action.category !== 'social_follow') return false;
    await this.prisma.earnAction.delete({ where: { id } });
    return true;
  }

  async hasCompleted(projectId: number, customerId: number, slug: string, year?: number): Promise<boolean> {
    const entry = await this.prisma.customerActionLog.findUnique({
      where: {
        projectId_customerId_actionSlug_year: {
          projectId,
          customerId,
          actionSlug: slug,
          year: year ?? 0,
        },
      },
    });
    return !!entry;
  }

  async markCompleted(projectId: number, customerId: number, slug: string, year?: number) {
    await this.prisma.customerActionLog.upsert({
      where: {
        projectId_customerId_actionSlug_year: {
          projectId,
          customerId,
          actionSlug: slug,
          year: year ?? 0,
        },
      },
      update: {},
      create: {
        projectId,
        customerId,
        actionSlug: slug,
        year: year ?? 0,
      },
    });
  }

  async getCompletions(projectId: number, customerId: number): Promise<string[]> {
    const entries = await this.prisma.customerActionLog.findMany({
      where: { projectId, customerId },
      select: { actionSlug: true, year: true },
    });
    return entries.map((e) => e.year ? `${e.actionSlug}:${e.year}` : e.actionSlug);
  }

  // ── Social Follow Claim Methods ──

  async initiateSocialClaim(projectId: number, customerId: number, slug: string) {
    return this.prisma.socialFollowClaim.upsert({
      where: {
        projectId_customerId_actionSlug: { projectId, customerId, actionSlug: slug },
      },
      update: {}, // Don't reset timer on re-click
      create: { projectId, customerId, actionSlug: slug },
    });
  }

  async getSocialClaimStatus(projectId: number, customerId: number, slug: string) {
    const claim = await this.prisma.socialFollowClaim.findUnique({
      where: {
        projectId_customerId_actionSlug: { projectId, customerId, actionSlug: slug },
      },
    });
    if (!claim) return null;
    return {
      initiated: true,
      initiated_at: claim.initiatedAt.toISOString(),
      claimed: !!claim.claimedAt,
    };
  }

  async completeSocialClaim(projectId: number, customerId: number, slug: string) {
    await this.prisma.socialFollowClaim.update({
      where: {
        projectId_customerId_actionSlug: { projectId, customerId, actionSlug: slug },
      },
      data: { claimedAt: new Date() },
    });
  }

  async getPendingSocialClaims(projectId: number, customerId: number) {
    return this.prisma.socialFollowClaim.findMany({
      where: { projectId, customerId, claimedAt: null },
      select: { actionSlug: true, initiatedAt: true },
    });
  }

  async getCompletedSlugs(projectId: number, customerId: number, currentYear?: number): Promise<Set<string>> {
    const entries = await this.prisma.customerActionLog.findMany({
      where: { projectId, customerId },
      select: { actionSlug: true, year: true },
    });
    const year = currentYear ?? new Date().getFullYear();
    return new Set(
      entries
        .filter((e) => e.year === 0 || e.year === year)
        .map((e) => e.actionSlug),
    );
  }
}
