import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectMembersService } from '../../src/projects/project-members.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ProjectMembersService(prisma as any);
  });

  describe('list', () => {
    it('should return explicit members and implicit org owners', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      const members = [
        { id: 1, projectId: 5, userId: 2, role: 'editor', user: { id: 2, email: 'a@test.com', name: 'A' } },
        { id: 2, projectId: 5, userId: 3, role: 'viewer', user: { id: 3, email: 'b@test.com', name: 'B' } },
      ];
      prisma.projectMember.findMany.mockResolvedValue(members);
      // Org owner (userId=10) not in explicit members → should be synthesized
      prisma.orgMembership.findMany.mockResolvedValue([
        { userId: 10, orgId: 1, role: 'owner', createdAt: new Date(), user: { id: 10, email: 'owner@test.com', name: 'Owner' } },
      ]);

      const result = await service.list(5);

      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe(10);
      expect(result[0].role).toBe('owner');
      expect(result[1].userId).toBe(2);
      expect(result[2].userId).toBe(3);
    });

    it('should not duplicate org owner who is already an explicit member', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      const members = [
        { id: 1, projectId: 5, userId: 10, role: 'owner', user: { id: 10, email: 'owner@test.com', name: 'Owner' } },
      ];
      prisma.projectMember.findMany.mockResolvedValue(members);
      // Org owner already in explicit → notIn filter excludes them
      prisma.orgMembership.findMany.mockResolvedValue([]);

      const result = await service.list(5);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(10);
    });

    it('should return empty array when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const result = await service.list(999);

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('should add a member to the project', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'a@test.com', name: 'A' });
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 2, orgId: 1, role: 'member' });
      prisma.projectMember.findUnique.mockResolvedValue(null);
      prisma.projectMember.upsert.mockResolvedValue({
        id: 1, projectId: 5, userId: 2, role: 'editor',
        user: { id: 2, email: 'a@test.com', name: 'A' },
      });

      const result = await service.add(5, 2, 'editor');

      expect(result.role).toBe('editor');
      expect(prisma.projectMember.upsert).toHaveBeenCalledWith({
        where: { projectId_userId: { projectId: 5, userId: 2 } },
        update: { role: 'editor' },
        create: { projectId: 5, userId: 2, role: 'editor' },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });
    });

    it('should throw BadRequestException for invalid role', async () => {
      await expect(service.add(5, 2, 'superadmin')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to add as owner', async () => {
      await expect(service.add(5, 2, 'owner')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.add(999, 2, 'editor')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.add(5, 999, 'editor')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user not in org (via orgMembership)', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'a@test.com', name: 'A' });
      prisma.orgMembership.findUnique.mockResolvedValue(null);

      await expect(service.add(5, 2, 'editor')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to overwrite owner role', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'a@test.com', name: 'A' });
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 2, orgId: 1, role: 'owner' });
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'owner' });

      await expect(service.add(5, 2, 'admin')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should update membership role', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'viewer' });
      prisma.projectMember.update.mockResolvedValue({
        id: 1, projectId: 5, userId: 2, role: 'editor',
        user: { id: 2, email: 'a@test.com', name: 'A' },
      });

      const result = await service.updateRole(5, 2, 'editor');

      expect(result.role).toBe('editor');
    });

    it('should throw BadRequestException for invalid role', async () => {
      await expect(service.updateRole(5, 2, 'superadmin')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to change TO owner', async () => {
      await expect(service.updateRole(5, 2, 'owner')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when membership not found', async () => {
      prisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.updateRole(5, 999, 'editor')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to change FROM owner', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'owner' });

      await expect(service.updateRole(5, 2, 'admin')).rejects.toThrow(BadRequestException);
    });

    it('should prevent demoting the last admin', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'admin' });
      prisma.projectMember.count.mockResolvedValue(1);

      await expect(service.updateRole(5, 2, 'editor')).rejects.toThrow(BadRequestException);
    });

    it('should allow demoting admin when multiple admins exist', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'admin' });
      prisma.projectMember.count.mockResolvedValue(2);
      prisma.projectMember.update.mockResolvedValue({
        id: 1, projectId: 5, userId: 2, role: 'editor',
        user: { id: 2, email: 'a@test.com', name: 'A' },
      });

      const result = await service.updateRole(5, 2, 'editor');

      expect(result.role).toBe('editor');
    });
  });

  describe('remove', () => {
    it('should remove a project member', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'editor' });
      prisma.projectMember.delete.mockResolvedValue({ projectId: 5, userId: 2 });

      const result = await service.remove(5, 2);

      expect(result).toEqual({ success: true });
      expect(prisma.projectMember.delete).toHaveBeenCalledWith({
        where: { projectId_userId: { projectId: 5, userId: 2 } },
      });
    });

    it('should throw NotFoundException when membership not found', async () => {
      prisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.remove(5, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to remove project owner', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'owner' });

      await expect(service.remove(5, 2)).rejects.toThrow(BadRequestException);
    });

    it('should prevent removing the last admin', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'admin' });
      prisma.projectMember.count.mockResolvedValue(1);

      await expect(service.remove(5, 2)).rejects.toThrow(BadRequestException);
    });

    it('should allow removing admin when multiple admins exist', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'admin' });
      prisma.projectMember.count.mockResolvedValue(2);
      prisma.projectMember.delete.mockResolvedValue({ projectId: 5, userId: 2 });

      const result = await service.remove(5, 2);

      expect(result).toEqual({ success: true });
    });
  });

  describe('transferOwnership', () => {
    it('should transfer ownership from project owner to another member', async () => {
      // Requester is project owner
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });
      prisma.projectMember.findFirst.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 3, email: 'c@test.com', name: 'C' });
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 3, orgId: 1, role: 'member' });

      const result = await service.transferOwnership(5, 1, 'member', 3);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should allow org owner to transfer even without project membership', async () => {
      // Requester is org owner but not project member
      prisma.projectMember.findUnique.mockResolvedValue(null);
      prisma.projectMember.findFirst.mockResolvedValue({ projectId: 5, userId: 10, role: 'owner' });
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 3, email: 'c@test.com', name: 'C' });
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 3, orgId: 1, role: 'member' });

      const result = await service.transferOwnership(5, 99, 'owner', 3);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when requester is neither project owner nor org owner', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'admin' });

      await expect(service.transferOwnership(5, 2, 'member', 3)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when new owner user not found', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.transferOwnership(5, 1, 'member', 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when new owner not in org (via orgMembership)', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 3, email: 'c@test.com', name: 'C' });
      prisma.orgMembership.findUnique.mockResolvedValue(null);

      await expect(service.transferOwnership(5, 1, 'member', 3)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when transferring to current owner', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });
      prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1 });
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@test.com', name: 'A' });
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 1, orgId: 1, role: 'owner' });
      prisma.projectMember.findFirst.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });

      await expect(service.transferOwnership(5, 1, 'owner', 1)).rejects.toThrow(BadRequestException);
    });
  });
});
