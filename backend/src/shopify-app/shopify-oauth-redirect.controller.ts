import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ShopifyAppController } from './shopify-app.controller';

/**
 * Handles the legacy OAuth callback path that Shopify has whitelisted.
 * Delegates to the main ShopifyAppController.handleCallback method.
 */
@Controller('api/v1/auth/shopify')
@SkipThrottle()
export class ShopifyOAuthRedirectController {
  constructor(private readonly shopifyAppController: ShopifyAppController) {}

  @Get('callback')
  async handleCallback(
    @Query() query: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.shopifyAppController.handleCallback(query, req, res);
  }
}
