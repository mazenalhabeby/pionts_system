import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrg(orgId: number) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: { select: { users: true, projects: true } },
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
    return this.prisma.user.findMany({
      where: { orgId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(orgId: number, email: string, password: string, name: string | undefined, role: string) {
    // Only 'owner' and 'member' are valid org roles; reject 'admin' (now project-level only)
    if (!['owner', 'member'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be owner or member');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { orgId, email, passwordHash, name: name || null, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
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

    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== orgId) {
      throw new BadRequestException('Member not found');
    }

    if (member.role === 'owner') {
      const ownerCount = await this.prisma.user.count({ where: { orgId, role: 'owner' } });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    await this.prisma.user.delete({ where: { id: memberId } });
    return { success: true };
  }
}
