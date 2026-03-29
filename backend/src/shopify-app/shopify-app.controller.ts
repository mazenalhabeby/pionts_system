import {
  Controller, Get, Query, Req, Res, Logger, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SkipThrottle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ShopifyAppService } from './shopify-app.service';
import { ShopifyApiService } from './shopify-api.service';

const SHOPIFY_SCOPES = 'read_customers,write_customers,read_orders,write_orders,read_products,write_price_rules,write_discounts,read_themes,write_themes';
const NONCE_COOKIE = 'shopify_nonce';

@Controller('shopify')
@SkipThrottle()
export class ShopifyAppController {
  private readonly logger = new Logger(ShopifyAppController.name);

  constructor(
    private readonly shopifyAppService: ShopifyAppService,
    private readonly shopifyApiService: ShopifyApiService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('auth')
  startAuth(
    @Query('shop') shop: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!shop || !this.isValidShopDomain(shop)) {
      throw new BadRequestException('Invalid shop parameter');
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL;
    if (!apiKey || !appUrl) {
      throw new BadRequestException('Shopify app not configured');
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    res.cookie(NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600000, // 10 minutes
      path: '/', // Available across all paths (callback may be on different route)
    });

    // Use the redirect URI that matches Shopify's whitelisted URL
    const redirectUri = `${appUrl}/api/v1/auth/shopify/callback`;
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

    res.redirect(authUrl);
  }

  @Get('auth/callback')
  async handleCallback(
    @Query() query: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { shop, code, state, hmac } = query;

    if (!shop || !code || !state || !hmac) {
      throw new BadRequestException('Missing required parameters');
    }

    if (!this.isValidShopDomain(shop)) {
      throw new BadRequestException('Invalid shop domain');
    }

    // Verify nonce
    const expectedNonce = req.cookies?.[NONCE_COOKIE];
    if (!expectedNonce || state !== expectedNonce) {
      throw new BadRequestException('Invalid state parameter');
    }
    res.clearCookie(NONCE_COOKIE);

    // Verify HMAC of query params
    if (!this.verifyQueryHmac(query)) {
      throw new BadRequestException('Invalid HMAC signature');
    }

    // Exchange code for access token
    const { accessToken, scope } = await this.shopifyApiService.exchangeCodeForToken(shop, code);

    // Provision store (create org, project, keys, webhooks, metafields, user)
    const result = await this.shopifyAppService.provisionStore(shop, accessToken, scope);

    this.logger.log(`Shopify OAuth complete for ${shop} — project ${result.projectId}`);

    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL || 'https://app.pionts.com';

    // Auto-login: if a user was created/linked, generate JWT tokens
    if (result.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: result.userId } });
      if (user) {
        const payload = { sub: user.id, currentOrgId: result.orgId, email: user.email, isSuperAdmin: false };
        const accessJwt = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET || 'dev-jwt-secret',
          expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
        });
        const refreshJwt = this.jwtService.sign(payload, {
          secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
          expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
        });

        // Set refresh token as HTTP-only cookie (same as normal login)
        res.cookie('refresh_token', refreshJwt, {
          httpOnly: true,
          path: '/auth',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === 'production',
        });

        // Pass access token via URL fragment (not sent to server, read by SPA)
        // Redirect to onboarding page with shop domain for context
        res.redirect(`${appUrl}/admin/setup/shopify?shopify=installed&shop=${encodeURIComponent(shop)}#access_token=${accessJwt}`);
        return;
      }
    }

    // Fallback: no user created, redirect to login (after login they'll see the dashboard)
    res.redirect(`${appUrl}/admin/login?shopify=installed&shop=${encodeURIComponent(shop)}&next=${encodeURIComponent(`/setup/shopify?shop=${shop}`)}`);
  }

  /**
   * Returns extension config for a given Shopify shop domain.
   * Called by the Customer Account UI extension to auto-configure itself
   * without requiring manual settings entry.
   */
  @Get('extension-config')
  async getExtensionConfig(
    @Query('shop') shop: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!shop || !this.isValidShopDomain(shop)) {
      throw new BadRequestException('Invalid shop parameter');
    }

    const installation = await this.prisma.shopifyInstallation.findUnique({
      where: { shopDomain: shop },
    });

    if (!installation || installation.uninstalledAt) {
      return { configured: false };
    }

    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL || 'https://app.pionts.com';

    return {
      configured: true,
      projectKey: installation.publicKey,
      apiBase: appUrl,
      hmacSecret: installation.hmacSecret,
    };
  }

  private isValidShopDomain(shop: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
  }

  private verifyQueryHmac(query: Record<string, string>): boolean {
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) return false;

    const { hmac, ...params } = query;
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const computed = crypto
      .createHmac('sha256', secret)
      .update(sortedParams)
      .digest('hex');

    const computedBuf = Buffer.from(computed, 'hex');
    const hmacBuf = Buffer.from(hmac, 'hex');

    return computedBuf.length === hmacBuf.length && crypto.timingSafeEqual(computedBuf, hmacBuf);
  }
}
