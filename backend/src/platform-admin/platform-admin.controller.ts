import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { PlatformAdminService } from './platform-admin.service';

@Controller('api/v1/platform')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@SkipThrottle()
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Get('stats')
  getStats() {
    return this.platformAdminService.getStats();
  }

  @Get('orgs')
  getOrganizations(
    @Query('q') search?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: 'asc' | 'desc',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.platformAdminService.getOrganizations(
      search,
      sort || 'createdAt',
      dir || 'desc',
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('orgs/:id')
  getOrganization(@Param('id', ParseIntPipe) id: number) {
    return this.platformAdminService.getOrganization(id);
  }

  @Get('users')
  getUsers(
    @Query('q') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.platformAdminService.getUsers(
      search,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.platformAdminService.getRecentActivity(
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
