import { Injectable, Inject, forwardRef, Optional, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { CustomersService } from '../customers/customers.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  async getTreeEntry(projectId: number, customerId: number) {
    return this.prisma.referralTree.findUnique({
      where: { projectId_customerId: { projectId, customerId } },
    });
  }

  async getTreeEntryWithRelations(projectId: number, customerId: number) {
    const entry = await this.prisma.referralTree.findUnique({
      where: { projectId_customerId: { projectId, customerId } },
      include: {
        parent: { select: { id: true, name: true, email: true } },
      },
    });
    if (!entry) return null;

    // Walk up to find grandparent (parent's parent) for backward compat display
    const parentEntry = await this.prisma.referralTree.findUnique({
      where: { projectId_customerId: { projectId, customerId: entry.parentId } },
      include: {
        parent: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      ...entry,
      grandparent: parentEntry?.parent || null,
    };
  }

  async getDirectCount(projectId: number, parentId: number): Promise<number> {
    return this.prisma.referralTree.count({ where: { projectId, parentId } });
  }

  async getNetworkCount(projectId: number, customerId: number): Promise<number> {
    // Recursive CTE with depth limit to prevent infinite loops from circular refs
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      WITH RECURSIVE chain AS (
        SELECT customer_id, 1 AS depth FROM referral_tree
        WHERE project_id = ${projectId} AND parent_id = ${customerId}
        UNION ALL
        SELECT rt.customer_id, c.depth + 1 FROM referral_tree rt
        INNER JOIN chain c ON rt.parent_id = c.customer_id
        WHERE rt.project_id = ${projectId} AND c.depth < 20
      )
      SELECT COUNT(*) as count FROM chain
    `);
    return Number(result[0]?.count || 0);
  }

  async getReferralStats(projectId: number, customerId: number) {
    const [direct, network] = await Promise.all([
      this.getDirectCount(projectId, customerId),
      this.getNetworkCount(projectId, customerId),
    ]);
    return { direct, network };
  }

  async linkReferral(projectId: number, customerId: number, referrerCode: string): Promise<boolean> {
    const referrer = await this.customersService.findByReferralCode(projectId, referrerCode);
    if (!referrer) return false;

    // Self-referral check
    if (referrer.id === customerId) return false;

    const directCount = await this.getDirectCount(projectId, referrer.id);
    if (directCount >= this.configService.getInt(projectId, 'max_direct_referrals')) return false;

    const existing = await this.getTreeEntry(projectId, customerId);
    if (existing) return false;

    // Cycle detection: ensure referrer is not a descendant of customer
    const descendantCount = await this.getNetworkCount(projectId, customerId);
    if (descendantCount > 0) {
      const isDescendant = await this.prisma.$queryRaw<Array<{ found: boolean }>>(Prisma.sql`
        WITH RECURSIVE chain AS (
          SELECT customer_id, 1 AS depth FROM referral_tree
          WHERE project_id = ${projectId} AND parent_id = ${customerId}
          UNION ALL
          SELECT rt.customer_id, c.depth + 1 FROM referral_tree rt
          INNER JOIN chain c ON rt.parent_id = c.customer_id
          WHERE rt.project_id = ${projectId} AND c.depth < 20
        )
        SELECT EXISTS(SELECT 1 FROM chain WHERE customer_id = ${referrer.id}) as found
      `);
      if (isDescendant[0]?.found) return false;
    }

    await this.prisma.referralTree.create({
      data: {
        projectId,
        customerId,
        parentId: referrer.id,
      },
    });

    await this.customersService.setReferredBy(customerId, referrerCode);

    // Send referral notification to referrer (fire-and-forget)
    if (this.notificationService) {
      const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        // Use level 2 points from referral_levels if available, fallback to 5
        const levels = await this.configService.getReferralLevels(projectId);
        const l2 = levels.find((l) => l.level === 2);
        const l2Points = l2?.points ?? 5;
        this.notificationService
          .onReferralUsed(projectId, referrer, customer.name || customer.email, l2Points)
          .catch((err) => this.logger.error('Referral notification failed', err?.message));
      }
    }

    return true;
  }

  /**
   * Walk up the referral chain from a customer, returning N levels of ancestors.
   * Level 2 = direct parent (the referrer), Level 3 = grandparent, etc.
   * Uses a recursive CTE for a single DB round-trip instead of N sequential queries.
   */
  async walkUpline(projectId: number, customerId: number, maxLevels: number): Promise<Array<{ customerId: number; level: number }>> {
    const rows = await this.prisma.$queryRaw<Array<{ parent_id: number; lvl: bigint }>>(Prisma.sql`
      WITH RECURSIVE upline AS (
        SELECT parent_id, 2 AS lvl FROM referral_tree
        WHERE project_id = ${projectId} AND customer_id = ${customerId}
        UNION ALL
        SELECT rt.parent_id, u.lvl + 1 FROM referral_tree rt
        INNER JOIN upline u ON rt.customer_id = u.parent_id
        WHERE rt.project_id = ${projectId} AND u.lvl < ${maxLevels + 1}
      )
      SELECT parent_id, lvl FROM upline ORDER BY lvl
    `);
    return rows.map(r => ({ customerId: Number(r.parent_id), level: Number(r.lvl) }));
  }

  async getDirectReferrals(projectId: number, customerId: number) {
    const entries = await this.prisma.referralTree.findMany({
      where: { projectId, parentId: customerId },
      include: { customer: { select: { id: true, name: true, email: true } } },
    });
    return entries.map((e) => e.customer);
  }

  async getReferralEarnings(projectId: number, customerId: number): Promise<number> {
    const result = await this.prisma.pointsLog.aggregate({
      where: {
        projectId,
        customerId,
        type: { startsWith: 'referral_l' },
      },
      _sum: { points: true },
    });
    return result._sum.points || 0;
  }

  async getDirectReferralsDetailed(projectId: number, customerId: number) {
    const entries = await this.prisma.referralTree.findMany({
      where: { projectId, parentId: customerId },
      include: {
        customer: {
          select: { id: true, name: true, email: true, orderCount: true, pointsBalance: true, lastActivity: true, createdAt: true },
        },
      },
    });
    return entries.map((e) => ({
      id: e.customer.id,
      name: e.customer.name,
      email: e.customer.email,
      order_count: e.customer.orderCount,
      points_balance: e.customer.pointsBalance,
      last_activity: e.customer.lastActivity,
      created_at: e.customer.createdAt,
    }));
  }

  private async buildTreeMaps(projectId: number, includeEmail = false) {
    const select = includeEmail
      ? { id: true, name: true, referralCode: true, email: true } as const
      : { id: true, name: true, referralCode: true } as const;
    const customers = await this.prisma.customer.findMany({
      where: { projectId },
      select,
    });
    const customerMap = new Map<number, any>();
    for (const c of customers) customerMap.set(c.id, c);

    const treeEntries = await this.prisma.referralTree.findMany({
      where: { projectId },
      select: { customerId: true, parentId: true },
    });
    const childrenMap = new Map<number, number[]>();
    const hasParent = new Set<number>();

    for (const t of treeEntries) {
      if (!childrenMap.has(t.parentId)) childrenMap.set(t.parentId, []);
      childrenMap.get(t.parentId)!.push(t.customerId);
      hasParent.add(t.customerId);
    }

    return { customerMap, childrenMap, hasParent };
  }

  private buildNode(
    nodeId: number,
    customerMap: Map<number, any>,
    childrenMap: Map<number, number[]>,
    includeEmail = false,
  ): any {
    const c = customerMap.get(nodeId);
    if (!c) return null;
    const children = (childrenMap.get(nodeId) || []).map((id) =>
      this.buildNode(id, customerMap, childrenMap, includeEmail),
    ).filter(Boolean);
    const node: any = { id: c.id, name: c.name, referral_code: c.referralCode, children };
    if (includeEmail) node.email = c.email;
    return node;
  }

  async getCustomerDownlineTree(projectId: number, customerId: number) {
    const { customerMap, childrenMap } = await this.buildTreeMaps(projectId);
    const directChildren = childrenMap.get(customerId) || [];
    return directChildren.map((id) => this.buildNode(id, customerMap, childrenMap)).filter(Boolean);
  }

  async getFullTree(projectId: number, limit = 50, offset = 0) {
    // Load only tree entries (not all customers) to determine structure
    const treeEntries = await this.prisma.referralTree.findMany({
      where: { projectId },
      select: { customerId: true, parentId: true },
    });

    const hasParent = new Set(treeEntries.map(t => t.customerId));
    const childrenMap = new Map<number, number[]>();
    for (const t of treeEntries) {
      if (!childrenMap.has(t.parentId)) childrenMap.set(t.parentId, []);
      childrenMap.get(t.parentId)!.push(t.customerId);
    }

    // Find roots (parents that are not children of anyone)
    const allRoots: number[] = [];
    for (const [parentId] of childrenMap) {
      if (!hasParent.has(parentId)) allRoots.push(parentId);
    }

    // Paginate roots
    const pagedRoots = allRoots.slice(offset, offset + limit);

    // Collect all customer IDs needed for the paged subtrees
    const neededIds = new Set<number>();
    const collectIds = (id: number) => {
      neededIds.add(id);
      for (const cid of childrenMap.get(id) || []) collectIds(cid);
    };
    for (const rootId of pagedRoots) collectIds(rootId);

    // Load only the needed customers
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: Array.from(neededIds) } },
      select: { id: true, name: true, referralCode: true, email: true },
    });
    const customerMap = new Map(customers.map(c => [c.id, c]));

    // Build trees for paged roots only
    const trees = pagedRoots.map(id => this.buildNode(id, customerMap, childrenMap, true)).filter(Boolean);

    return { trees, totalChains: allRoots.length, totalMembers: hasParent.size };
  }
}
