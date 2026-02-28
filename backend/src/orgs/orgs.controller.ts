import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgsService } from './orgs.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { toSnakeCaseCustomer } from '../utils/transformers';

@Controller('api/v1/orgs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get('me')
  async getOrg(@CurrentUser() user: any) {
    const org = await this.orgsService.getOrg(user.org.id);
    return {
      id: org!.id,
      name: org!.name,
      slug: org!.slug,
      createdAt: org!.createdAt,
      memberCount: org!._count.users,
      projectCount: org!._count.projects,
    };
  }

  @Put('me')
  async updateOrg(@CurrentUser() user: any, @Body() dto: UpdateOrgDto) {
    const org = await this.orgsService.updateOrg(user.org.id, dto.name);
    return { id: org.id, name: org.name, slug: org.slug };
  }

  @Get('me/members')
  async getMembers(@CurrentUser() user: any) {
    return this.orgsService.getMembers(user.org.id);
  }

  @Post('me/members')
  @Roles('owner')
  async addMember(@CurrentUser() user: any, @Body() dto: AddMemberDto) {
    return this.orgsService.addMember(user.org.id, dto.email, dto.password, dto.name, dto.role);
  }

  @Get('me/customers')
  async getCustomers(
    @CurrentUser() user: any,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.orgsService.searchOrgCustomers(
      user.org.id, q, sort, dir,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
    return {
      customers: result.customers.map(c => ({
        ...toSnakeCaseCustomer(c),
        project_id: c.projectId,
        project_name: (c as any).projectName,
      })),
      total: result.total,
    };
  }

  @Delete('me/members/:memberId')
  @Roles('owner')
  async removeMember(@CurrentUser() user: any, @Param('memberId') memberId: string) {
    return this.orgsService.removeMember(user.org.id, parseInt(memberId, 10), user.id);
  }
}
