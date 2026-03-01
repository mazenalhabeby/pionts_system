import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { OrgsService } from '../../src/orgs/orgs.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('OrgsService', () => {
  let service: OrgsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrgsService>(OrgsService);
  });

  describe('getOrg', () => {
    it('should return org with membership and project counts', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 1, name: 'Test Org', slug: 'test-org',
        _count: { memberships: 3, projects: 2 },
      });

      const result = await service.getOrg(1);

      expect(result).toBeDefined();
      expect(result!.name).toBe('Test Org');
      expect(result!._count.memberships).toBe(3);
      expect(result!._count.projects).toBe(2);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { _count: { select: { memberships: true, projects: true } } },
      });
    });
  });

  describe('updateOrg', () => {
    it('should update org name', async () => {
      prisma.organization.update.mockResolvedValue({ id: 1, name: 'New Name', slug: 'test-org' });

      const result = await service.updateOrg(1, 'New Name');

      expect(result.name).toBe('New Name');
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });
  });

  describe('getMembers', () => {
    it('should return members sorted by createdAt asc via orgMembership', async () => {
      const memberships = [
        { id: 1, role: 'owner', createdAt: new Date('2024-01-01'), user: { id: 1, email: 'a@test.com', name: 'A', createdAt: new Date('2024-01-01') } },
        { id: 2, role: 'member', createdAt: new Date('2024-01-02'), user: { id: 2, email: 'b@test.com', name: 'B', createdAt: new Date('2024-01-02') } },
      ];
      prisma.orgMembership.findMany.mockResolvedValue(memberships);

      const result = await service.getMembers(1);

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('a@test.com');
      expect(result[0].role).toBe('owner');
      expect(result[1].role).toBe('member');
    });
  });

  describe('addMember', () => {
    it('should add an existing user to org via orgMembership', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'new@test.com', name: 'New User', createdAt: new Date() });
      prisma.orgMembership.findUnique.mockResolvedValue(null);
      prisma.orgMembership.create.mockResolvedValue({ id: 1, userId: 2, orgId: 1, role: 'member' });

      const result = await service.addMember(1, 'new@test.com', 'member');

      expect(result.email).toBe('new@test.com');
      expect(result.role).toBe('member');
      expect(prisma.orgMembership.create).toHaveBeenCalledWith({
        data: { userId: 2, orgId: 1, role: 'member' },
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(1, 'nobody@test.com', 'member'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already in org', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, email: 'dup@test.com', name: 'Dup', createdAt: new Date() });
      prisma.orgMembership.findUnique.mockResolvedValue({ id: 1, userId: 2, orgId: 1, role: 'member' });

      await expect(
        service.addMember(1, 'dup@test.com', 'member'),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject invalid role values', async () => {
      await expect(
        service.addMember(1, 'new@test.com', 'superadmin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject admin role (now project-level only)', async () => {
      await expect(
        service.addMember(1, 'new@test.com', 'admin'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should delete org membership successfully', async () => {
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 2, orgId: 1, role: 'member' });
      prisma.orgMembership.delete.mockResolvedValue({ userId: 2, orgId: 1 });
      prisma.project.findMany.mockResolvedValue([]);

      const result = await service.removeMember(1, 2, 1);

      expect(result).toEqual({ success: true });
      expect(prisma.orgMembership.delete).toHaveBeenCalledWith({
        where: { userId_orgId: { userId: 2, orgId: 1 } },
      });
    });

    it('should throw BadRequestException for self-deletion', async () => {
      await expect(
        service.removeMember(1, 5, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if member not in org', async () => {
      prisma.orgMembership.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember(1, 2, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if removing last owner', async () => {
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 2, orgId: 1, role: 'owner' });
      prisma.orgMembership.count.mockResolvedValue(1);

      await expect(
        service.removeMember(1, 2, 3),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow removing an owner when multiple owners exist', async () => {
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 2, orgId: 1, role: 'owner' });
      prisma.orgMembership.count.mockResolvedValue(2);
      prisma.orgMembership.delete.mockResolvedValue({ userId: 2, orgId: 1 });
      prisma.project.findMany.mockResolvedValue([]);

      const result = await service.removeMember(1, 2, 3);

      expect(result).toEqual({ success: true });
    });

    it('should also remove project memberships for the org projects', async () => {
      prisma.orgMembership.findUnique.mockResolvedValue({ userId: 2, orgId: 1, role: 'member' });
      prisma.orgMembership.delete.mockResolvedValue({ userId: 2, orgId: 1 });
      prisma.project.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }]);
      prisma.projectMember.deleteMany.mockResolvedValue({ count: 2 });

      await service.removeMember(1, 2, 1);

      expect(prisma.projectMember.deleteMany).toHaveBeenCalledWith({
        where: { userId: 2, projectId: { in: [5, 6] } },
      });
    });
  });
});
