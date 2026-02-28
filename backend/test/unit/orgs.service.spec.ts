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
    it('should return org with user and project counts', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 1, name: 'Test Org', slug: 'test-org',
        _count: { users: 3, projects: 2 },
      });

      const result = await service.getOrg(1);

      expect(result).toBeDefined();
      expect(result!.name).toBe('Test Org');
      expect(result!._count.users).toBe(3);
      expect(result!._count.projects).toBe(2);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { _count: { select: { users: true, projects: true } } },
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
    it('should return members sorted by createdAt asc', async () => {
      const members = [
        { id: 1, email: 'a@test.com', name: 'A', role: 'owner', createdAt: new Date('2024-01-01') },
        { id: 2, email: 'b@test.com', name: 'B', role: 'member', createdAt: new Date('2024-01-02') },
      ];
      prisma.user.findMany.mockResolvedValue(members);

      const result = await service.getMembers(1);

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('a@test.com');
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { orgId: 1 },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('addMember', () => {
    it('should create a new member with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(async ({ data }) => ({
        id: 2, email: data.email, name: data.name, role: data.role, createdAt: new Date(),
      }));

      const result = await service.addMember(1, 'new@test.com', 'password123', 'New User', 'member');

      expect(result.email).toBe('new@test.com');
      expect(result.role).toBe('member');
      expect(prisma.user.create).toHaveBeenCalled();
      // Verify password was hashed (not stored as plaintext)
      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('password123');
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'dup@test.com' });

      await expect(
        service.addMember(1, 'dup@test.com', 'password123', 'Dup', 'member'),
      ).rejects.toThrow(ConflictException);
    });

    it('should accept null name', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(async ({ data }) => ({
        id: 2, email: data.email, name: data.name, role: data.role, createdAt: new Date(),
      }));

      const result = await service.addMember(1, 'noname@test.com', 'password123', undefined, 'member');

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.name).toBeNull();
    });

    it('should reject admin role (now project-level only)', async () => {
      await expect(
        service.addMember(1, 'new@test.com', 'password123', 'New User', 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid role values', async () => {
      await expect(
        service.addMember(1, 'new@test.com', 'password123', 'New User', 'superadmin'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should delete a member successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, orgId: 1, role: 'member' });
      prisma.user.delete.mockResolvedValue({ id: 2 });

      const result = await service.removeMember(1, 2, 1);

      expect(result).toEqual({ success: true });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });

    it('should throw BadRequestException for self-deletion', async () => {
      await expect(
        service.removeMember(1, 5, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if member not in org', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, orgId: 99, role: 'member' });

      await expect(
        service.removeMember(1, 2, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if member not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember(1, 999, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if removing last owner', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, orgId: 1, role: 'owner' });
      prisma.user.count.mockResolvedValue(1);

      await expect(
        service.removeMember(1, 2, 3),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow removing an owner when multiple owners exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 2, orgId: 1, role: 'owner' });
      prisma.user.count.mockResolvedValue(2);
      prisma.user.delete.mockResolvedValue({ id: 2 });

      const result = await service.removeMember(1, 2, 3);

      expect(result).toEqual({ success: true });
    });
  });
});
