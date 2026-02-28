import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ROLES_KEY, type ProjectRole } from '../decorators/project-roles.decorator';

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = parseInt(request.params.id, 10);

    if (!user || !projectId || isNaN(projectId)) {
      throw new ForbiddenException('Access denied');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== user.org.id) throw new ForbiddenException('Access denied');

    // Determine effective project role: check explicit membership first, then org-owner fallback
    let effectiveRole: string;

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (membership) {
      effectiveRole = membership.role;
    } else if (user.role === 'owner') {
      // Org owners have implicit admin on all projects (even without a ProjectMember row)
      effectiveRole = 'admin';
    } else {
      throw new ForbiddenException('Access denied');
    }

    // Check @ProjectRoles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(PROJECT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));
      const userLevel = ROLE_HIERARCHY[effectiveRole] ?? 0;
      if (userLevel < minRequired) {
        throw new ForbiddenException('Insufficient project role');
      }
    }

    request.project = project;
    request.projectRole = effectiveRole;
    return true;
  }
}
