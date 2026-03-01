import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { orgId: true },
    });
    if (!project) return [];

    // Get explicit project members
    const explicit = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const explicitUserIds = new Set(explicit.map((m) => m.userId));

    // Get org owners who have implicit admin access but no explicit membership
    const orgOwners = await this.prisma.orgMembership.findMany({
      where: { orgId: project.orgId, role: 'owner', userId: { notIn: [...explicitUserIds] } },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Synthesize project member entries for implicit org owners
    const implicitMembers = orgOwners.map((m) => ({
      id: 0,
      projectId,
      userId: m.userId,
      role: 'owner' as const,
      createdAt: m.createdAt,
      user: m.user,
    }));

    return [...implicitMembers, ...explicit];
  }

  async add(projectId: number, userId: number, role: string) {
    // Validate role — cannot add as 'owner' (must use transferOwnership)
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be admin, editor, or viewer');
    }

    // Verify user exists and belongs to same org (via OrgMembership)
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const orgMembership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId: project.orgId } },
    });
    if (!orgMembership) {
      throw new BadRequestException('User does not belong to this organization');
    }

    // Check if user already has owner role — don't overwrite it
    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing?.role === 'owner') {
      throw new BadRequestException('Cannot change owner role — use transfer ownership instead');
    }

    // Upsert membership
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { role },
      create: { projectId, userId, role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateRole(projectId: number, userId: number, role: string) {
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be admin, editor, or viewer');
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    // Block changing FROM owner role
    if (membership.role === 'owner') {
      throw new BadRequestException('Cannot change owner role — use transfer ownership instead');
    }

    // Prevent removing last admin
    if (membership.role === 'admin' && role !== 'admin') {
      const adminCount = await this.prisma.projectMember.count({
        where: { projectId, role: 'admin' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot change role of the last project admin');
      }
    }

    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async remove(projectId: number, userId: number) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    // Block removing project owner
    if (membership.role === 'owner') {
      throw new BadRequestException('Cannot remove project owner — transfer ownership first');
    }

    // Prevent removing last admin
    if (membership.role === 'admin') {
      const adminCount = await this.prisma.projectMember.count({
        where: { projectId, role: 'admin' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last project admin');
      }
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    return { success: true };
  }

  async transferOwnership(
    projectId: number,
    requesterId: number,
    requesterOrgRole: string,
    newOwnerId: number,
  ) {
    // 1. Verify requester is project owner OR org owner
    const requesterMembership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: requesterId } },
    });

    const isProjectOwner = requesterMembership?.role === 'owner';
    const isOrgOwner = requesterOrgRole === 'owner';

    if (!isProjectOwner && !isOrgOwner) {
      throw new ForbiddenException('Only the project owner or org owner can transfer ownership');
    }

    // 2. Verify new owner belongs to same org
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const newOwnerUser = await this.prisma.user.findUnique({ where: { id: newOwnerId } });
    if (!newOwnerUser) throw new NotFoundException('User not found');

    const newOwnerOrgMembership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: newOwnerId, orgId: project.orgId } },
    });
    if (!newOwnerOrgMembership) {
      throw new BadRequestException('User does not belong to this organization');
    }

    // 3. Find current owner's ProjectMember row
    const currentOwner = await this.prisma.projectMember.findFirst({
      where: { projectId, role: 'owner' },
    });

    // 4. Cannot transfer to yourself
    if (currentOwner && currentOwner.userId === newOwnerId) {
      throw new BadRequestException('User is already the project owner');
    }

    // 5. Atomic transaction: upsert new owner, demote old owner
    await this.prisma.$transaction([
      // Set new owner
      this.prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: newOwnerId } },
        update: { role: 'owner' },
        create: { projectId, userId: newOwnerId, role: 'owner' },
      }),
      // Demote old owner to admin (if exists)
      ...(currentOwner
        ? [
            this.prisma.projectMember.update({
              where: { projectId_userId: { projectId, userId: currentOwner.userId } },
              data: { role: 'admin' },
            }),
          ]
        : []),
    ]);

    return { success: true };
  }
}
