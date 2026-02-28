import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // ── Authenticated endpoints (JWT + owner role) ──

  @Post('api/v1/orgs/me/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async create(@CurrentUser() user: any, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(user.org.id, user.id, dto.email, dto.role, dto.projectId);
  }

  @Get('api/v1/orgs/me/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async listPending(@CurrentUser() user: any) {
    return this.invitationsService.listPending(user.org.id);
  }

  @Delete('api/v1/orgs/me/invitations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async revoke(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.invitationsService.revoke(user.org.id, id);
  }

  @Post('api/v1/orgs/me/invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async resend(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
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
