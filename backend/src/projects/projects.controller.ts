import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProjectRoles } from '../common/decorators/project-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { ProjectMembersService } from './project-members.service';
import { ApiKeyService } from '../auth/api-key.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    const { project, keys } = await this.projectsService.create(
      user.org.id, dto.name, dto.domain, dto.platform, user.id, user.role,
      { pointsEnabled: dto.pointsEnabled, referralsEnabled: dto.referralsEnabled, partnersEnabled: dto.partnersEnabled },
    );
    return {
      project: {
        id: project.id, name: project.name, domain: project.domain,
        platform: project.platform, status: project.status,
        pointsEnabled: project.pointsEnabled,
        referralsEnabled: project.referralsEnabled,
        partnersEnabled: project.partnersEnabled,
      },
      apiKeys: keys,
    };
  }

  @Get()
  async list(@CurrentUser() user: any) {
    const projects = await this.projectsService.list(user.org.id, user.id, user.role);
    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      platform: p.platform,
      status: p.status,
      createdAt: p.createdAt,
      customerCount: p._count.customers,
      keyCount: p._count.apiKeys,
      projectRole: p.members?.[0]?.role ?? (user.role === 'owner' ? 'admin' : null),
      pointsEnabled: p.pointsEnabled,
      referralsEnabled: p.referralsEnabled,
      partnersEnabled: p.partnersEnabled,
    }));
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('viewer')
  async findById(@Param('id') id: string) {
    const project = (await this.projectsService.findById(parseInt(id, 10)))!;
    return {
      id: project.id,
      name: project.name,
      domain: project.domain,
      platform: project.platform,
      status: project.status,
      createdAt: project.createdAt,
      pointsEnabled: project.pointsEnabled,
      referralsEnabled: project.referralsEnabled,
      partnersEnabled: project.partnersEnabled,
    };
  }

  @Put(':id')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const project = await this.projectsService.update(parseInt(id, 10), dto);
    return {
      id: project.id, name: project.name, domain: project.domain, status: project.status,
      pointsEnabled: project.pointsEnabled, referralsEnabled: project.referralsEnabled,
      partnersEnabled: project.partnersEnabled,
    };
  }

  @Delete(':id')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  @Roles('owner')
  async archive(@Param('id') id: string) {
    await this.projectsService.archive(parseInt(id, 10));
    return { success: true };
  }

  @Post(':id/keys')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async generateKeys(@Param('id') id: string) {
    const keys = await this.apiKeyService.generateKeyPair(parseInt(id, 10));
    return keys;
  }

  @Get(':id/keys')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async listKeys(@Param('id') id: string) {
    return this.apiKeyService.listKeys(parseInt(id, 10));
  }

  @Delete(':id/keys/:keyId')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  @Roles('owner')
  async revokeKey(@Param('keyId') keyId: string) {
    await this.apiKeyService.revokeKey(parseInt(keyId, 10));
    return { success: true };
  }

  @Get(':id/hmac-secret')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  @Roles('owner')
  async getHmacSecret(@Param('id') id: string) {
    const project = await this.projectsService.findById(parseInt(id, 10));
    return { hmacSecret: project?.hmacSecret || null };
  }

  // ── Project Member Management ──────────────────────────────────────

  @Get(':id/members')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async listMembers(@Param('id') id: string) {
    return this.projectMembersService.list(parseInt(id, 10));
  }

  @Post(':id/members')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async addMember(@Param('id') id: string, @Body() body: { userId: number; role: string }) {
    return this.projectMembersService.add(parseInt(id, 10), body.userId, body.role);
  }

  @Put(':id/members/:memberId')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
  ) {
    return this.projectMembersService.updateRole(parseInt(id, 10), parseInt(memberId, 10), body.role);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.projectMembersService.remove(parseInt(id, 10), parseInt(memberId, 10));
  }

  @Post(':id/transfer-ownership')
  @UseGuards(ProjectMemberGuard)
  @ProjectRoles('admin')
  async transferOwnership(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { userId: number },
  ) {
    return this.projectMembersService.transferOwnership(
      parseInt(id, 10),
      user.id,
      user.role,
      body.userId,
    );
  }
}
