import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
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
        email,
        passwordHash,
        name: name || null,
      },
    });

    // Create OrgMembership(owner)
    await this.prisma.orgMembership.create({
      data: { userId: user.id, orgId: org.id, role: 'owner' },
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

    const tokens = this.generateTokens(user.id, org.id, user.email);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: 'owner' },
      org: { id: org.id, name: org.name, slug: org.slug },
      orgs: [{ id: org.id, name: org.name, slug: org.slug, role: 'owner' }],
      project: { id: project.id, name: project.name },
      apiKeys: keys,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        orgMemberships: { include: { org: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.orgMemberships.length === 0) {
      throw new UnauthorizedException('User has no organization memberships');
    }

    // Default to first org
    const defaultMembership = user.orgMemberships[0];
    const tokens = this.generateTokens(user.id, defaultMembership.orgId, user.email, user.isSuperAdmin);

    const orgs = user.orgMemberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: m.role,
    }));

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: defaultMembership.role, isSuperAdmin: user.isSuperAdmin },
      org: { id: defaultMembership.org.id, name: defaultMembership.org.name, slug: defaultMembership.org.slug },
      orgs,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { orgMemberships: true },
      });
      if (!user) throw new UnauthorizedException('User not found');

      // Preserve currentOrgId from the token, fall back to orgId for backward compat
      const currentOrgId = payload.currentOrgId ?? payload.orgId;

      // Validate user still has membership in the org
      const membership = user.orgMemberships.find((m) => m.orgId === currentOrgId);
      if (!membership) {
        // Fall back to first org if the old org membership was removed
        if (user.orgMemberships.length === 0) {
          throw new UnauthorizedException('User has no organization memberships');
        }
        return this.generateTokens(user.id, user.orgMemberships[0].orgId, user.email, user.isSuperAdmin);
      }

      return this.generateTokens(user.id, currentOrgId, user.email, user.isSuperAdmin);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async switchOrg(userId: number, targetOrgId: number) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId: targetOrgId } },
      include: { org: true },
    });
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = this.generateTokens(userId, targetOrgId, user.email, user.isSuperAdmin);

    return {
      ...tokens,
      org: { id: membership.org.id, name: membership.org.name, slug: membership.org.slug },
      role: membership.role,
    };
  }

  private generateTokens(userId: number, currentOrgId: number, email: string, isSuperAdmin = false) {
    const payload = { sub: userId, currentOrgId, email, isSuperAdmin };

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
