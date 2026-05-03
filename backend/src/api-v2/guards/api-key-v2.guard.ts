import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../../auth/api-key.service';

/**
 * Guard for API v2 endpoints.
 * Validates the `X-Api-Key` header (secret key only — server-to-server auth).
 * Attaches the resolved project to `request.project`.
 */
@Injectable()
export class ApiKeyV2Guard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const project = await this.apiKeyService.validateKey(apiKey, 'secret');
    if (!project) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request.project = project;
    return true;
  }
}
