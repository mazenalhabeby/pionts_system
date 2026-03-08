import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectRoles } from '../common/decorators/project-roles.decorator';
import { CustomersService } from '../customers/customers.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AppConfigService } from '../config/app-config.service';
import { AwardDeductDto } from '../admin/dto/award-deduct.dto';
import { toSnakeCaseCustomer } from '../utils/transformers';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Dashboard')
@Controller('api/v1/projects/:id')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class DashboardController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly referralsService: ReferralsService,
    private readonly configService: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  @ProjectRoles('viewer')
  async stats(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    const [stats, recentActivity, topReferrers] = await Promise.all([
      this.customersService.getStats(projectId),
      this.customersService.getRecentActivity(projectId),
      this.customersService.getTopReferrers(projectId),
    ]);
    return { stats, recentActivity, topReferrers };
  }

  @Get('customers')
  @ProjectRoles('viewer')
  async customers(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const projectId = parseInt(id, 10);
    const result = await this.customersService.searchCustomers(
      projectId, q, sort, dir,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
    return {
      customers: result.customers.map(toSnakeCaseCustomer),
      total: result.total,
    };
  }

  @Get('customers/:custId')
  @ProjectRoles('viewer')
  async customerDetail(@Param('id') id: string, @Param('custId') custId: string) {
    const projectId = parseInt(id, 10);
    const customer = await this.customersService.findById(projectId, parseInt(custId, 10));
    if (!customer) throw new NotFoundException('Customer not found');

    const [history, referralStats, directReferrals, tree] = await Promise.all([
      this.customersService.getHistory(projectId, customer.id, 50),
      this.referralsService.getReferralStats(projectId, customer.id),
      this.referralsService.getDirectReferrals(projectId, customer.id),
      this.referralsService.getTreeEntryWithRelations(projectId, customer.id),
    ]);

    const referredByCustomer = tree?.parent
      ? { id: tree.parent.id, name: tree.parent.name, email: tree.parent.email }
      : null;

    const grandparent = tree?.grandparent
      ? { id: tree.grandparent.id, name: tree.grandparent.name, email: tree.grandparent.email }
      : null;

    return {
      customer: toSnakeCaseCustomer(customer),
      history,
      referralStats,
      directReferrals,
      referredByCustomer,
      grandparent,
    };
  }

  @Post('customers')
  @ProjectRoles('editor')
  async createCustomer(@Param('id') id: string, @Body() body: { email: string; name?: string; birthday?: string }) {
    const projectId = parseInt(id, 10);
    if (!body.email) throw new BadRequestException('email is required');
    const customer = await this.customersService.createCustomer(projectId, body.email, body.name, body.birthday);
    return { customer: toSnakeCaseCustomer(customer) };
  }

  @Put('customers/:custId')
  @ProjectRoles('editor')
  async updateCustomer(@Param('id') id: string, @Param('custId') custId: string, @Body() body: { email?: string; name?: string; birthday?: string; referred_by?: string | null }) {
    const projectId = parseInt(id, 10);
    const customer = await this.customersService.updateCustomer(projectId, parseInt(custId, 10), body);
    return { customer: toSnakeCaseCustomer(customer) };
  }

  @Delete('customers/:custId')
  @ProjectRoles('editor')
  async deleteCustomer(@Param('id') id: string, @Param('custId') custId: string) {
    const projectId = parseInt(id, 10);
    await this.customersService.deleteCustomer(projectId, parseInt(custId, 10));
    return { success: true };
  }

  @Post('customers/:custId/award')
  @ProjectRoles('editor')
  async awardPoints(@Param('id') id: string, @Param('custId') custId: string, @Body() dto: AwardDeductDto) {
    const projectId = parseInt(id, 10);
    const customer = await this.customersService.findById(projectId, parseInt(custId, 10));
    if (!customer) throw new NotFoundException('Customer not found');

    const newBalance = await this.customersService.awardPoints(
      projectId, customer.id, dto.points, 'manual', dto.reason || 'Manual award',
    );
    return { success: true, new_balance: newBalance };
  }

  @Post('customers/:custId/deduct')
  @ProjectRoles('editor')
  async deductPoints(@Param('id') id: string, @Param('custId') custId: string, @Body() dto: AwardDeductDto) {
    const projectId = parseInt(id, 10);
    const customer = await this.customersService.findById(projectId, parseInt(custId, 10));
    if (!customer) throw new NotFoundException('Customer not found');

    const newBalance = await this.customersService.deductPoints(
      projectId, customer.id, dto.points, 'manual', dto.reason || 'Manual deduction',
    );
    return { success: true, new_balance: newBalance };
  }

  @Get('settings')
  @ProjectRoles('viewer')
  async getSettings(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    return { settings: await this.configService.getAll(projectId), defaults: this.configService.getDefaults() };
  }

  @Post('settings')
  @ProjectRoles('editor')
  async saveSettings(@Param('id') id: string, @Body() body: Record<string, string>) {
    const projectId = parseInt(id, 10);
    await this.configService.saveAll(projectId, body);
    return { success: true, settings: await this.configService.getAll(projectId) };
  }

  @Get('referrals')
  @ProjectRoles('viewer')
  async referrals(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    return this.referralsService.getFullTree(projectId);
  }

  // ── Redemption Tiers CRUD ─────────────────────────────────────────

  @Get('redemption-tiers')
  @ProjectRoles('viewer')
  async listTiers(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    return this.configService.getRedemptionTiers(projectId);
  }

  @Post('redemption-tiers')
  @ProjectRoles('editor')
  async createTier(@Param('id') id: string, @Body() body: { points: number; discount: number; sortOrder?: number }) {
    const projectId = parseInt(id, 10);
    if (!body.points || !body.discount) throw new BadRequestException('points and discount are required');
    return this.prisma.redemptionTier.create({
      data: { projectId, points: body.points, discount: body.discount, sortOrder: body.sortOrder ?? 99 },
    });
  }

  @Put('redemption-tiers/:tierId')
  @ProjectRoles('editor')
  async updateTier(@Param('id') id: string, @Param('tierId') tierId: string, @Body() body: { points?: number; discount?: number; sortOrder?: number }) {
    return this.prisma.redemptionTier.update({
      where: { id: parseInt(tierId, 10) },
      data: body,
    });
  }

  @Delete('redemption-tiers/:tierId')
  @ProjectRoles('editor')
  async deleteTier(@Param('tierId') tierId: string) {
    await this.prisma.redemptionTier.delete({ where: { id: parseInt(tierId, 10) } });
    return { success: true };
  }

  // ── Referral Levels CRUD ──────────────────────────────────────────

  @Get('referral-levels')
  @ProjectRoles('viewer')
  async listLevels(@Param('id') id: string) {
    const projectId = parseInt(id, 10);
    return this.configService.getReferralLevels(projectId);
  }

  @Post('referral-levels')
  @ProjectRoles('editor')
  async createLevel(@Param('id') id: string, @Body() body: { level: number; points: number }) {
    const projectId = parseInt(id, 10);
    if (!body.level || body.points == null) throw new BadRequestException('level and points are required');
    return this.prisma.referralLevel.create({
      data: { projectId, level: body.level, points: body.points },
    });
  }

  @Put('referral-levels/:levelId')
  @ProjectRoles('editor')
  async updateLevel(@Param('levelId') levelId: string, @Body() body: { level?: number; points?: number }) {
    return this.prisma.referralLevel.update({
      where: { id: parseInt(levelId, 10) },
      data: body,
    });
  }

  @Delete('referral-levels/:levelId')
  @ProjectRoles('editor')
  async deleteLevel(@Param('levelId') levelId: string) {
    await this.prisma.referralLevel.delete({ where: { id: parseInt(levelId, 10) } });
    return { success: true };
  }
}
