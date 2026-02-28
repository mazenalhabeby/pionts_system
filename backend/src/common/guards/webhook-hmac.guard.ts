import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookHmacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = process.env.WEBHOOK_SECRET;

    // Skip verification in dev if no secret configured
    if (!secret) {
      // If body is a Buffer (raw body), parse it
      if (Buffer.isBuffer(request.body)) {
        try {
          request.body = JSON.parse(request.body.toString());
        } catch {
          throw new BadRequestException('Invalid JSON');
        }
      }
      return true;
    }

    const hmac = request.headers['x-shopify-hmac-sha256'];
    if (!hmac) {
      throw new UnauthorizedException('Missing HMAC header');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Missing raw body for HMAC verification');
    }

    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

    if (!crypto.timingSafeEqual(Buffer.from(hmac as string), Buffer.from(computed))) {
      throw new UnauthorizedException('Invalid HMAC');
    }

    // Parse body from raw if it's still a Buffer
    if (Buffer.isBuffer(request.body)) {
      try {
        request.body = JSON.parse(request.body.toString());
      } catch {
        throw new BadRequestException('Invalid JSON');
      }
    }

    return true;
  }
}
