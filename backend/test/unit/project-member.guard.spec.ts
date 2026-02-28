import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectMemberGuard } from '../../src/common/guards/project-member.guard';
import { PROJECT_ROLES_KEY } from '../../src/common/decorators/project-roles.decorator';
import { createPrismaMock, PrismaMock } from '../mocks/prisma.mock';

describe('ProjectMemberGuard', () => {
  let guard: ProjectMemberGuard;
  let prisma: PrismaMock;
  let reflector: Reflector;

  function createMockContext(user: any, params: Record<string, string> = {}): ExecutionContext {
    const request = { user, params, project: undefined as any, projectRole: undefined as any };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    prisma = createPrismaMock();
    reflector = new Reflector();
    guard = new ProjectMemberGuard(prisma as any, reflector);
  });

  it('should allow owner with implicit admin access', async () => {
    const user = { id: 1, role: 'owner', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.project).toEqual({ id: 5, orgId: 1, name: 'Test' });
    expect(req.projectRole).toBe('admin');
  });

  it('should allow member with matching ProjectMember row', async () => {
    const user = { id: 2, role: 'member', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'editor' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.projectRole).toBe('editor');
  });

  it('should throw ForbiddenException for member without ProjectMember row', async () => {
    const user = { id: 2, role: 'member', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    prisma.projectMember.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should enforce role hierarchy — viewer cannot access editor endpoints', async () => {
    const user = { id: 2, role: 'member', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'viewer' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['editor']);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow editor to access viewer endpoints (hierarchy)', async () => {
    const user = { id: 2, role: 'member', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'editor' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['viewer']);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow admin to access editor endpoints (hierarchy)', async () => {
    const user = { id: 2, role: 'member', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    prisma.projectMember.findUnique.mockResolvedValue({ projectId: 5, userId: 2, role: 'admin' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['editor']);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw NotFoundException when project does not exist', async () => {
    const user = { id: 1, role: 'owner', org: { id: 1 } };
    const context = createMockContext(user, { id: '999' });
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when project belongs to different org', async () => {
    const user = { id: 1, role: 'owner', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 99, name: 'Other' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user on request', async () => {
    const context = createMockContext(null, { id: '5' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for invalid project id', async () => {
    const user = { id: 1, role: 'owner', org: { id: 1 } };
    const context = createMockContext(user, { id: 'abc' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow owner to access admin endpoints', async () => {
    const user = { id: 1, role: 'owner', org: { id: 1 } };
    const context = createMockContext(user, { id: '5' });
    prisma.project.findUnique.mockResolvedValue({ id: 5, orgId: 1, name: 'Test' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
