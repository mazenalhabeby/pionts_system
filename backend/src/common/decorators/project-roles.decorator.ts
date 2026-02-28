import { SetMetadata } from '@nestjs/common';

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export const PROJECT_ROLES_KEY = 'projectRoles';
export const ProjectRoles = (...roles: ProjectRole[]) => SetMetadata(PROJECT_ROLES_KEY, roles);
