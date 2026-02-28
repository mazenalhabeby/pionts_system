import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectRoles } from '../common/decorators/project-roles.decorator';
import { EarnActionsService } from './earn-actions.service';

@Controller('api/v1/projects/:id/earn-actions')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class EarnActionsController {
  constructor(private readonly earnActionsService: EarnActionsService) {}

  @Get()
  @ProjectRoles('viewer')
  async list(@Param('id') id: string) {
    return this.earnActionsService.getActions(parseInt(id, 10));
  }

  @Post()
  @ProjectRoles('editor')
  async create(@Param('id') id: string, @Body() body: {
    slug: string;
    label: string;
    points: number;
    category?: string;
    frequency?: string;
    socialUrl?: string;
    sortOrder?: number;
  }) {
    if (!body.slug || !body.label) throw new BadRequestException('slug and label are required');
    return this.earnActionsService.createAction(parseInt(id, 10), body);
  }

  @Put(':actionId')
  @ProjectRoles('editor')
  async update(@Param('id') id: string, @Param('actionId') actionId: string, @Body() body: {
    label?: string;
    points?: number;
    enabled?: boolean;
    socialUrl?: string;
    sortOrder?: number;
    frequency?: string;
  }) {
    return this.earnActionsService.updateAction(parseInt(id, 10), parseInt(actionId, 10), body);
  }

  @Delete(':actionId')
  @ProjectRoles('editor')
  async remove(@Param('id') id: string, @Param('actionId') actionId: string) {
    const deleted = await this.earnActionsService.deleteAction(parseInt(id, 10), parseInt(actionId, 10));
    if (!deleted) throw new BadRequestException('Cannot delete predefined actions');
    return { success: true };
  }
}
