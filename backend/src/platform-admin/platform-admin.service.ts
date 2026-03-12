import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalOrgs, totalUsers, totalProjects, totalCustomers, activeProjects] =
      await Promise.all([
        this.prisma.organization.count(),
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.customer.count(),
        this.prisma.project.count({ where: { status: 'active' } }),
      ]);

    return {
      totalOrgs: Number(totalOrgs),
      totalUsers: Number(totalUsers),
      totalProjects: Number(totalProjects),
      totalCustomers: Number(totalCustomers),
      activeProjects: Number(activeProjects),
    };
  }

  async getOrganizations(
    search?: string,
    sort = 'createdAt',
    dir: 'asc' | 'desc' = 'desc',
    limit = 20,
    offset = 0,
  ) {
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const orderBy = { [sort]: dir };

    const [orgs, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          memberships: { include: { user: { select: { id: true, email: true, name: true } } } },
          projects: { select: { id: true, _count: { select: { customers: true } } } },
          subscription: { select: { plan: true, status: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    const data = orgs.map((org) => {
      const owner = org.memberships.find((m) => m.role === 'owner');
      const customerCount = org.projects.reduce((sum, p) => sum + p._count.customers, 0);
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        ownerEmail: owner?.user.email || null,
        ownerName: owner?.user.name || null,
        memberCount: org.memberships.length,
        projectCount: org.projects.length,
        customerCount,
        plan: org.subscription?.plan || 'free',
      };
    });

    return { data, total, limit, offset };
  }

  async getOrganization(orgId: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: { include: { user: { select: { id: true, email: true, name: true, isSuperAdmin: true, createdAt: true } } } },
        projects: {
          select: {
            id: true,
            name: true,
            domain: true,
            status: true,
            platform: true,
            createdAt: true,
            _count: { select: { customers: true } },
          },
        },
        subscription: true,
      },
    });
    if (!org) throw new NotFoundException('Organization not found');

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      members: org.memberships.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
        isSuperAdmin: m.user.isSuperAdmin,
        joinedAt: m.createdAt,
      })),
      projects: org.projects.map((p) => ({
        id: p.id,
        name: p.name,
        domain: p.domain,
        status: p.status,
        platform: p.platform,
        createdAt: p.createdAt,
        customerCount: p._count.customers,
      })),
      subscription: org.subscription
        ? { plan: org.subscription.plan, status: org.subscription.status, currentPeriodEnd: org.subscription.currentPeriodEnd }
        : null,
    };
  }

  async getUsers(search?: string, limit = 20, offset = 0) {
    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          orgMemberships: { include: { org: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isSuperAdmin: u.isSuperAdmin,
      createdAt: u.createdAt,
      orgs: u.orgMemberships.map((m) => ({
        id: m.org.id,
        name: m.org.name,
        role: m.role,
      })),
    }));

    return { data, total, limit, offset };
  }

  async getRecentActivity(limit = 20) {
    const [recentUsers, recentProjects, recentCustomers] = await Promise.all([
      this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, email: true, name: true, createdAt: true } }),
      this.prisma.project.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, name: true, createdAt: true, org: { select: { name: true } } } }),
      this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, email: true, name: true, createdAt: true, project: { select: { name: true } } } }),
    ]);

    const activities = [
      ...recentUsers.map((u) => ({ type: 'user_signup' as const, description: `${u.name || u.email} signed up`, createdAt: u.createdAt })),
      ...recentProjects.map((p) => ({ type: 'project_created' as const, description: `Project "${p.name}" created by ${p.org.name}`, createdAt: p.createdAt })),
      ...recentCustomers.map((c) => ({ type: 'customer_joined' as const, description: `${c.name || c.email} joined ${c.project.name}`, createdAt: c.createdAt })),
    ];

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities.slice(0, limit);
  }
}
