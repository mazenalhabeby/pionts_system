import {
  Controller, Get, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectRoles } from '../common/decorators/project-roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/projects/:id/analytics')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
@ProjectRoles('viewer')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('points-economy')
  async pointsEconomy(
    @Param('id') id: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const projectId = parseInt(id, 10);
    const buckets = await this.analyticsService.getPointsEconomy(projectId, period, from, to);
    return { buckets };
  }

  @Get('referral-funnel')
  async referralFunnel(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const projectId = parseInt(id, 10);
    return this.analyticsService.getReferralFunnel(projectId, from, to);
  }

  @Get('segments')
  async segments(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    return this.analyticsService.getCustomerSegments(projectId);
  }

  @Get('segments/:segment/customers')
  async segmentCustomers(
    @Param('id') id: string,
    @Param('segment') segment: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const projectId = parseInt(id, 10);
    return this.analyticsService.getSegmentCustomers(
      projectId,
      segment,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('export/customers')
  async exportCustomers(@Param('id') id: string, @Res() res: Response) {
    const projectId = parseInt(id, 10);
    const csv = await this.analyticsService.exportCustomersCsv(projectId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  }

  @Get('export/points-log')
  async exportPointsLog(
    @Param('id') id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const projectId = parseInt(id, 10);
    const csv = await this.analyticsService.exportPointsLogCsv(projectId, from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="points-log.csv"');
    res.send(csv);
  }
}
