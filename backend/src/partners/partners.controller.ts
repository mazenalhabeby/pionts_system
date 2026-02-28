import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectRoles } from '../common/decorators/project-roles.decorator';
import { PartnersService } from './partners.service';
import { toSnakeCaseCustomer } from '../utils/transformers';

@Controller('api/v1/projects/:id/partners')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  @ProjectRoles('viewer')
  async list(@Param('id') id: string) {
    return this.partnersService.listPartners(parseInt(id, 10));
  }

  @Post()
  @ProjectRoles('editor')
  async promote(@Param('id') id: string, @Body() body: { customerId: number; commissionPct: number }) {
    if (!body.customerId || body.commissionPct == null) {
      throw new BadRequestException('customerId and commissionPct are required');
    }
    const customer = await this.partnersService.promoteToPartner(
      parseInt(id, 10), body.customerId, body.commissionPct,
    );
    return { success: true, customer: toSnakeCaseCustomer(customer) };
  }

  @Put(':partnerId')
  @ProjectRoles('editor')
  async updateCommission(
    @Param('id') id: string,
    @Param('partnerId') partnerId: string,
    @Body() body: { commissionPct: number },
  ) {
    if (body.commissionPct == null) throw new BadRequestException('commissionPct is required');
    await this.partnersService.updateCommission(parseInt(id, 10), parseInt(partnerId, 10), body.commissionPct);
    return { success: true };
  }

  @Delete(':partnerId')
  @ProjectRoles('editor')
  async demote(@Param('id') id: string, @Param('partnerId') partnerId: string) {
    await this.partnersService.demotePartner(parseInt(id, 10), parseInt(partnerId, 10));
    return { success: true };
  }

  @Get(':partnerId/earnings')
  @ProjectRoles('viewer')
  async getEarnings(@Param('id') id: string, @Param('partnerId') partnerId: string) {
    return this.partnersService.getPartnerEarnings(parseInt(id, 10), parseInt(partnerId, 10));
  }
}
