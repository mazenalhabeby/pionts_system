import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ShopifyWebhookHmacGuard implements CanActivate {
  private readonly logger = new Logger(ShopifyWebhookHmacGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const hmacHeader = request.headers['x-shopify-hmac-sha256'] as string;
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!hmacHeader || !secret) {
      this.logger.warn('Missing HMAC header or SHOPIFY_API_SECRET');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.warn('rawBody not available — ensure NestFactory has rawBody: true');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    const computedBuf = Buffer.from(computed, 'base64');
    const receivedBuf = Buffer.from(hmacHeader, 'base64');

    if (computedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(computedBuf, receivedBuf)) {
      this.logger.warn('Shopify webhook HMAC verification failed');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
