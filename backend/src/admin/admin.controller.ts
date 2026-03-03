import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { CustomersService } from '../customers/customers.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AppConfigService } from '../config/app-config.service';
import { LoginDto } from './dto/login.dto';
import { AwardDeductDto } from './dto/award-deduct.dto';
import { toSnakeCaseCustomer } from '../utils/transformers';
import { resolveProjectId } from '../common/helpers/project-resolver';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly referralsService: ReferralsService,
    private readonly configService: AppConfigService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const password = process.env.ADMIN_PASSWORD || 'admin';
    if (dto.password === password) {
      req.session.adminAuth = true;
      return { success: true };
    }
    throw new UnauthorizedException('Invalid password');
  }

  @Post('logout')
  logout(@Req() req: Request) {
    req.session.destroy(() => {});
    return { success: true };
  }

  @Get('api/session')
  session(@Req() req: Request) {
    return { authenticated: !!req.session?.adminAuth };
  }

  @Get('api/stats')
  @UseGuards(AdminAuthGuard)
  async stats(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    const [stats, recentActivity, topReferrers] = await Promise.all([
      this.customersService.getStats(projectId),
      this.customersService.getRecentActivity(projectId),
      this.customersService.getTopReferrers(projectId),
    ]);
    return { stats, recentActivity, topReferrers };
  }

  @Get('api/customers')
  @UseGuards(AdminAuthGuard)
  async customers(
    @Req() req: Request,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const projectId = resolveProjectId(req.session);
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

  @Get('api/customer/:id')
  @UseGuards(AdminAuthGuard)
  async customerDetail(@Req() req: Request, @Param('id') id: string) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.findById(projectId, parseInt(id, 10));
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

  @Post('api/customer/:id/award')
  @UseGuards(AdminAuthGuard)
  async awardPoints(@Req() req: Request, @Param('id') id: string, @Body() dto: AwardDeductDto) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.findById(projectId, parseInt(id, 10));
    if (!customer) throw new NotFoundException('Customer not found');

    const newBalance = await this.customersService.awardPoints(
      projectId,
      customer.id,
      dto.points,
      'manual',
      dto.reason || 'Manual award',
    );
    return { success: true, new_balance: newBalance };
  }

  @Post('api/customer/:id/deduct')
  @UseGuards(AdminAuthGuard)
  async deductPoints(@Req() req: Request, @Param('id') id: string, @Body() dto: AwardDeductDto) {
    const projectId = resolveProjectId(req.session);
    const customer = await this.customersService.findById(projectId, parseInt(id, 10));
    if (!customer) throw new NotFoundException('Customer not found');

    const newBalance = await this.customersService.deductPoints(
      projectId,
      customer.id,
      dto.points,
      'manual',
      dto.reason || 'Manual deduction',
    );
    return { success: true, new_balance: newBalance };
  }

  @Get('api/settings')
  @UseGuards(AdminAuthGuard)
  async getSettings(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    return { settings: await this.configService.getAll(projectId), defaults: this.configService.getDefaults() };
  }

  @Post('api/settings')
  @UseGuards(AdminAuthGuard)
  async saveSettings(@Req() req: Request, @Body() body: Record<string, string>) {
    const projectId = resolveProjectId(req.session);
    await this.configService.saveAll(projectId, body);
    return { success: true, settings: await this.configService.getAll(projectId) };
  }

  @Get('api/referrals')
  @UseGuards(AdminAuthGuard)
  async referrals(@Req() req: Request) {
    const projectId = resolveProjectId(req.session);
    return this.referralsService.getFullTree(projectId);
  }

  // SPA fallback — serve admin-ui index.html for all non-API admin routes
  // Static assets (/admin/assets/*) are served directly, everything else gets index.html
  @Get('*path')
  serveAdmin(@Req() req: Request, @Res() res: Response) {
    const relative = req.path.replace(/^\/admin\//, '');
    if (relative.startsWith('assets/')) {
      const filePath = path.join(__dirname, '..', '..', '..', 'admin-ui', 'dist', relative);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(filePath);
    }
    res.sendFile(path.join(__dirname, '..', '..', '..', 'admin-ui', 'dist', 'index.html'));
  }
}
