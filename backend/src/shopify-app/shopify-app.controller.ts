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
    // If no shop param or invalid, show the install landing page
    if (!shop || !this.isValidShopDomain(shop)) {
      res.type('html').send(this.getInstallPage(shop || ''));
      return;
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

  /**
   * Returns a self-contained HTML install page for merchants
   * who visit /shopify/auth without a valid shop parameter.
   */
  private getInstallPage(attempted: string): string {
    const error = attempted
      ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#991b1b;font-size:14px;">
           <strong>"${attempted.replace(/[<>"]/g, '')}"</strong> is not a valid Shopify store domain. It should end with <code>.myshopify.com</code>
         </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Install Pionts Rewards — Shopify</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #141414; border: 1px solid #262626; border-radius: 16px; padding: 40px; max-width: 460px; width: 100%; margin: 20px; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; justify-content: center; }
    .logo-icon { width: 40px; height: 40px; background: #ff3c00; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; }
    h1 { font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 8px; }
    .subtitle { text-align: center; color: #a3a3a3; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
    label { display: block; font-size: 13px; font-weight: 600; color: #d4d4d4; margin-bottom: 6px; }
    .input-wrap { display: flex; align-items: stretch; border: 1px solid #333; border-radius: 10px; overflow: hidden; background: #1a1a1a; margin-bottom: 8px; transition: border-color .2s; }
    .input-wrap:focus-within { border-color: #ff3c00; }
    input { flex: 1; background: transparent; border: none; color: #fff; font-size: 15px; padding: 12px 14px; outline: none; font-family: inherit; }
    input::placeholder { color: #555; }
    .suffix { display: flex; align-items: center; padding: 0 14px; color: #666; font-size: 14px; background: #111; border-left: 1px solid #262626; white-space: nowrap; user-select: none; }
    .hint { font-size: 12px; color: #666; margin-bottom: 20px; }
    button { width: 100%; padding: 13px; background: #ff3c00; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .2s; font-family: inherit; }
    button:hover { background: #e63600; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .features { margin-top: 28px; padding-top: 24px; border-top: 1px solid #222; }
    .features h3 { font-size: 13px; font-weight: 600; color: #a3a3a3; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .05em; }
    .feature { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
    .feature svg { flex-shrink: 0; margin-top: 2px; }
    .feature span { font-size: 13px; color: #999; line-height: 1.4; }
    code { background: #262626; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">P</div>
      <span style="font-size:20px;font-weight:700;">Pionts</span>
    </div>

    <h1>Install Pionts Rewards</h1>
    <p class="subtitle">Add a loyalty &amp; referral rewards program to your Shopify store in under a minute.</p>

    ${error}

    <form id="installForm" onsubmit="return handleSubmit(event)">
      <label for="shop">Your Shopify store</label>
      <div class="input-wrap">
        <input type="text" id="shop" name="shop" placeholder="your-store" autocomplete="off" autocapitalize="none" spellcheck="false" required />
        <div class="suffix">.myshopify.com</div>
      </div>
      <p class="hint">Enter the name from your <code>*.myshopify.com</code> URL</p>
      <button type="submit" id="btn">Install on Shopify</button>
    </form>

    <div class="features">
      <h3>What you get</h3>
      <div class="feature">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3c00" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Points system — customers earn points on every purchase, review, social follow &amp; referral</span>
      </div>
      <div class="feature">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3c00" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>3-level referral program — reward customers who bring new buyers</span>
      </div>
      <div class="feature">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3c00" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Automatic setup — widget, webhooks &amp; rewards page configured instantly</span>
      </div>
      <div class="feature">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3c00" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Admin dashboard — manage points, customers &amp; analytics</span>
      </div>
    </div>
  </div>

  <script>
    function handleSubmit(e) {
      e.preventDefault();
      var raw = document.getElementById('shop').value.trim().toLowerCase();
      // Strip protocol, path, .myshopify.com suffix if user pasted full URL
      raw = raw.replace(/^https?:\\/\\//, '').replace(/\\/.*/g, '').replace(/\\.myshopify\\.com$/, '');
      if (!raw || !/^[a-z0-9][a-z0-9-]*$/.test(raw)) {
        alert('Please enter a valid store name (letters, numbers, hyphens)');
        return false;
      }
      document.getElementById('btn').disabled = true;
      document.getElementById('btn').textContent = 'Redirecting...';
      window.location.href = '/v2/shopify/auth?shop=' + encodeURIComponent(raw + '.myshopify.com');
      return false;
    }
  </script>
</body>
</html>`;
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
