import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../../src/projects/projects.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ApiKeyService } from '../../src/auth/api-key.service';
import { AppConfigService } from '../../src/config/app-config.service';
import { EarnActionsService } from '../../src/earn-actions/earn-actions.service';
import { BillingService } from '../../src/billing/billing.service';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaMock;

  const mockApiKeyService = {
    generateKeyPair: jest.fn().mockResolvedValue({
      publicKey: 'pk_live_test123',
      secretKey: 'sk_live_test123',
    }),
  };

  const mockConfigService = {
    loadSettingsForProject: jest.fn().mockResolvedValue(undefined),
  };

  const mockEarnActionsService = {
    seedDefaultActions: jest.fn().mockResolvedValue(undefined),
  };

  const mockBillingService = {
    canCreateProject: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ApiKeyService, useValue: mockApiKeyService },
        { provide: AppConfigService, useValue: mockConfigService },
        { provide: EarnActionsService, useValue: mockEarnActionsService },
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('should create project, generate keys, and load settings', async () => {
      prisma.project.create.mockResolvedValue({
        id: 1, orgId: 1, name: 'My Project', domain: null, status: 'active',
      });

      const result = await service.create(1, 'My Project');

      expect(result.project.name).toBe('My Project');
      expect(result.project.domain).toBeNull();
      expect(result.keys.publicKey).toBe('pk_live_test123');
      expect(result.keys.secretKey).toBe('sk_live_test123');
      expect(mockApiKeyService.generateKeyPair).toHaveBeenCalledWith(1);
      expect(mockConfigService.loadSettingsForProject).toHaveBeenCalledWith(1);
    });

    it('should pass domain when provided', async () => {
      prisma.project.create.mockResolvedValue({
        id: 2, orgId: 1, name: 'Store', domain: 'store.com', status: 'active',
      });

      await service.create(1, 'Store', 'store.com');

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ orgId: 1, name: 'Store', domain: 'store.com' }),
      });
      const callData = (prisma.project.create as jest.Mock).mock.calls[0][0].data;
      expect(callData.hmacSecret).toBeDefined();
      expect(typeof callData.hmacSecret).toBe('string');
      expect(callData.hmacSecret).toHaveLength(64);
    });

    it('should default domain to null when not provided', async () => {
      prisma.project.create.mockResolvedValue({
        id: 3, orgId: 1, name: 'NoDomain', domain: null, status: 'active',
      });

      await service.create(1, 'NoDomain');

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ orgId: 1, name: 'NoDomain', domain: null }),
      });
      const callData = (prisma.project.create as jest.Mock).mock.calls[0][0].data;
      expect(callData.hmacSecret).toBeDefined();
      expect(callData.hmacSecret).toHaveLength(64);
    });

    it('should auto-create ProjectMember(owner) for non-owner creators', async () => {
      prisma.project.create.mockResolvedValue({
        id: 4, orgId: 1, name: 'Member Project', domain: null, status: 'active',
      });
      prisma.projectMember.create.mockResolvedValue({ projectId: 4, userId: 10, role: 'owner' });

      await service.create(1, 'Member Project', undefined, undefined, 10, 'member');

      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: { projectId: 4, userId: 10, role: 'owner' },
      });
    });

    it('should auto-create ProjectMember(owner) for org-owner creators', async () => {
      prisma.project.create.mockResolvedValue({
        id: 5, orgId: 1, name: 'Owner Project', domain: null, status: 'active',
      });
      prisma.projectMember.create.mockResolvedValue({ projectId: 5, userId: 1, role: 'owner' });

      await service.create(1, 'Owner Project', undefined, undefined, 1, 'owner');

      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: { projectId: 5, userId: 1, role: 'owner' },
      });
    });
  });

  describe('list', () => {
    it('should return all non-archived projects for owner', async () => {
      const projects = [
        { id: 2, name: 'B', status: 'active', _count: { customers: 5, apiKeys: 2 } },
        { id: 1, name: 'A', status: 'active', _count: { customers: 3, apiKeys: 2 } },
      ];
      prisma.project.findMany.mockResolvedValue(projects);

      const result = await service.list(1, 1, 'owner');

      expect(result).toHaveLength(2);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: 1, status: { not: 'archived' } },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by membership for non-owner users', async () => {
      const projects = [
        { id: 1, name: 'A', status: 'active', _count: { customers: 3, apiKeys: 2 }, members: [{ role: 'editor' }] },
      ];
      prisma.project.findMany.mockResolvedValue(projects);

      const result = await service.list(1, 5, 'member');

      expect(result).toHaveLength(1);
      const call = prisma.project.findMany.mock.calls[0][0];
      expect(call.where.members).toEqual({ some: { userId: 5 } });
    });

    it('should return all projects when no userId provided (backward compat)', async () => {
      prisma.project.findMany.mockResolvedValue([]);

      await service.list(1);

      const call = prisma.project.findMany.mock.calls[0][0];
      expect(call.where.members).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return project by id', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 1, name: 'Test', orgId: 1 });

      const result = await service.findById(1);

      expect(result!.name).toBe('Test');
      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null for non-existent project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project fields', async () => {
      prisma.project.update.mockResolvedValue({
        id: 1, name: 'Updated', domain: 'new.com', status: 'active',
      });

      const result = await service.update(1, { name: 'Updated', domain: 'new.com' });

      expect(result.name).toBe('Updated');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated', domain: 'new.com' },
      });
    });
  });

  describe('archive', () => {
    it('should set project status to archived', async () => {
      prisma.project.update.mockResolvedValue({ id: 1, status: 'archived' });

      const result = await service.archive(1);

      expect(result.status).toBe('archived');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'archived' },
      });
    });
  });
});
