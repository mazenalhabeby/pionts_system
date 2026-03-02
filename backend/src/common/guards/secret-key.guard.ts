import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from '../../auth/api-key.service';

@Injectable()
export class SecretKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Support header (standard) or query param (for Shopify webhooks which can't send custom headers)
    const secretKey = (request.headers['x-secret-key'] || request.query?.secret_key) as string;

    if (!secretKey) {
      throw new UnauthorizedException('Missing X-Secret-Key header');
    }

    if (!secretKey.startsWith('sk_live_')) {
      throw new UnauthorizedException('Invalid key type — secret key required');
    }

    const project = await this.apiKeyService.validateKey(secretKey, 'secret');
    if (!project) {
      throw new UnauthorizedException('Invalid or revoked secret key');
    }

    request.project = project;
    return true;
  }
}
