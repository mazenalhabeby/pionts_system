import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: number;  // userId
  email: string;
  currentOrgId: number;
  // Legacy fields for backward compat during token transition
  orgId?: number;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-jwt-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Backward compat: handle old tokens that have orgId instead of currentOrgId
    const currentOrgId = payload.currentOrgId ?? payload.orgId;
    if (!currentOrgId) throw new UnauthorizedException('Invalid token: missing org context');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        orgMemberships: { include: { org: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const membership = user.orgMemberships.find((m) => m.orgId === currentOrgId);
    if (!membership) throw new UnauthorizedException('Not a member of this organization');

    // Shim: attach org, orgId, and role so all existing guards/controllers work unchanged
    return {
      ...user,
      org: membership.org,
      orgId: membership.orgId,
      role: membership.role,
    };
  }
}
