import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Org owners can do anything; project admins can manage project-scoped invitations */
  private async canManageInvitationForProject(user: any, projectId: number | null | undefined): Promise<boolean> {
    if (user.role === 'owner') return true;
    if (!projectId) return false;
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    return !!membership && (membership.role === 'admin' || membership.role === 'owner');
  }

  // ── Authenticated endpoints ──

  @Post('api/v1/orgs/me/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@CurrentUser() user: any, @Body() dto: CreateInvitationDto) {
    if (!(await this.canManageInvitationForProject(user, dto.projectId))) {
      throw new ForbiddenException('Insufficient role');
    }
    return this.invitationsService.create(user.org.id, user.id, dto.email, dto.role, dto.projectId);
  }

  @Get('api/v1/orgs/me/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async listPending(@CurrentUser() user: any) {
    return this.invitationsService.listPending(user.org.id);
  }

  @Delete('api/v1/orgs/me/invitations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async revoke(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    const invitation = await this.invitationsService.findPendingInOrg(user.org.id, id);
    if (!(await this.canManageInvitationForProject(user, invitation?.projectId))) {
      throw new ForbiddenException('Insufficient role');
    }
    return this.invitationsService.revoke(user.org.id, id);
  }

  @Post('api/v1/orgs/me/invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async resend(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    const invitation = await this.invitationsService.findPendingInOrg(user.org.id, id);
    if (!(await this.canManageInvitationForProject(user, invitation?.projectId))) {
      throw new ForbiddenException('Insufficient role');
    }
    return this.invitationsService.resend(user.org.id, id);
  }

  // ── Public endpoints (token-based, no auth) ──

  @Get('api/v1/invitations/:token')
  async getByToken(@Param('token') token: string) {
    return this.invitationsService.getByToken(token);
  }

  @Post('api/v1/invitations/:token/accept')
  async accept(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(token, dto.password, dto.name);
  }
}
