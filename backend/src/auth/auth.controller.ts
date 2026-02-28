import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/auth',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  secure: process.env.NODE_ENV === 'production',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto.email, dto.password, dto.name, dto.orgName);
    res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    const { refreshToken, ...body } = result;
    return body;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    const { refreshToken, ...body } = result;
    return body;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res.status(401);
      return { error: 'No refresh token' };
    }
    const result = await this.authService.refresh(token);
    res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/auth' });
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    // For non-owner users, include project memberships so frontend can cache roles
    let projectMemberships: { projectId: number; role: string }[] = [];
    if (user.role !== 'owner') {
      const memberships = await this.prisma.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true, role: true },
      });
      projectMemberships = memberships;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      org: {
        id: user.org.id,
        name: user.org.name,
        slug: user.org.slug,
      },
      projectMemberships,
    };
  }
}
