import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrg(orgId: number) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: { select: { memberships: true, projects: true } },
      },
    });
  }

  async updateOrg(orgId: number, name: string) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { name },
    });
  }

  async getMembers(orgId: number) {
    const memberships = await this.prisma.orgMembership.findMany({
      where: { orgId },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      createdAt: m.user.createdAt,
    }));
  }

  async addMember(orgId: number, email: string, role: string) {
    // Only 'owner' and 'member' are valid org roles
    if (!['owner', 'member'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be owner or member');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      throw new BadRequestException('User not found. Use the invitation flow to invite new users.');
    }

    // Check if already a member of this org
    const existingMembership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: existingUser.id, orgId } },
    });
    if (existingMembership) {
      throw new ConflictException('User is already a member of this organization');
    }

    await this.prisma.orgMembership.create({
      data: { userId: existingUser.id, orgId, role },
    });

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role,
      createdAt: existingUser.createdAt,
    };
  }

  async searchOrgCustomers(orgId: number, query?: string, sort?: string, dir?: string, limit = 50, offset = 0) {
    limit = Math.min(limit, 200);
    const sortMap: Record<string, string> = {
      id: 'id', email: 'email', name: 'name',
      points_balance: 'pointsBalance', pointsBalance: 'pointsBalance',
      points_earned_total: 'pointsEarnedTotal', pointsEarnedTotal: 'pointsEarnedTotal',
      order_count: 'orderCount', orderCount: 'orderCount',
    };
    const sortCol = (sort && sortMap[sort]) || 'id';
    const sortDir = dir === 'asc' ? 'asc' : 'desc';

    // Get all project IDs in this org
    const projects = await this.prisma.project.findMany({
      where: { orgId },
      select: { id: true, name: true },
    });
    const projectIds = projects.map(p => p.id);
    const projectNameMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

    const where: any = { projectId: { in: projectIds } };
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { [sortCol]: sortDir },
        take: limit,
        skip: offset,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers: customers.map(c => ({ ...c, projectName: projectNameMap[c.projectId] || 'Unknown' })),
      total,
    };
  }

  async removeMember(orgId: number, memberId: number, requestingUserId: number) {
    if (memberId === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: memberId, orgId } },
    });
    if (!membership) {
      throw new BadRequestException('Member not found');
    }

    if (membership.role === 'owner') {
      const ownerCount = await this.prisma.orgMembership.count({ where: { orgId, role: 'owner' } });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    // Delete the org membership (not the user)
    await this.prisma.orgMembership.delete({
      where: { userId_orgId: { userId: memberId, orgId } },
    });

    // Also remove project memberships for this org's projects
    const orgProjects = await this.prisma.project.findMany({
      where: { orgId },
      select: { id: true },
    });
    if (orgProjects.length > 0) {
      await this.prisma.projectMember.deleteMany({
        where: {
          userId: memberId,
          projectId: { in: orgProjects.map((p) => p.id) },
        },
      });
    }

    return { success: true };
  }
}
