import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyService } from './api-key.service';
import { AppConfigService } from '../config/app-config.service';
import { EarnActionsService } from '../earn-actions/earn-actions.service';
import { DEFAULT_TIERS, DEFAULT_LEVELS } from '../common/constants/defaults';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly apiKeyService: ApiKeyService,
    private readonly configService: AppConfigService,
    private readonly earnActionsService: EarnActionsService,
  ) {}

  async register(email: string, password: string, name: string | undefined, orgName: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const passwordHash = await bcrypt.hash(password, 10);

    const org = await this.prisma.organization.create({
      data: {
        name: orgName,
        slug: `${slug}-${Date.now().toString(36)}`,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        orgId: org.id,
        email,
        passwordHash,
        name: name || null,
        role: 'owner',
      },
    });

    const hmacSecret = crypto.randomBytes(32).toString('hex');
    const project = await this.prisma.project.create({
      data: {
        orgId: org.id,
        name: `${orgName} Rewards`,
        domain: null,
        hmacSecret,
      },
    });

    // Create ProjectMember(owner) for the registering user on their default project
    await this.prisma.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: 'owner' },
    });

    // Generate API keys for the default project
    const keys = await this.apiKeyService.generateKeyPair(project.id);

    // Initialize default settings for the project
    await this.configService.loadSettingsForProject(project.id);

    // Seed default earn actions, redemption tiers, and referral levels
    await this.earnActionsService.seedDefaultActions(project.id);
    await this.prisma.redemptionTier.createMany({
      data: DEFAULT_TIERS.map((t) => ({ projectId: project.id, ...t })),
    });
    await this.prisma.referralLevel.createMany({
      data: DEFAULT_LEVELS.map((l) => ({ projectId: project.id, ...l })),
    });

    // Create free subscription for the org
    await this.prisma.subscription.create({
      data: {
        orgId: org.id,
        stripeCustomerId: `cus_free_${org.id}`,
        plan: 'free',
        status: 'active',
      },
    });

    const tokens = this.generateTokens(user.id, org.id, user.email, user.role);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      org: { id: org.id, name: org.name, slug: org.slug },
      project: { id: project.id, name: project.name },
      apiKeys: keys,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { org: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user.id, user.orgId, user.email, user.role);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      org: { id: user.org.id, name: user.org.name, slug: user.org.slug },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      return this.generateTokens(user.id, user.orgId, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: number, orgId: number, email: string, role: string) {
    const payload = { sub: userId, orgId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'dev-jwt-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

    return { accessToken, refreshToken };
  }
}
