import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../../auth/api-key.service';
import { SCOPE_KEY } from '../decorators/require-scope.decorator';

/** Scope hierarchy: full > checkout > readonly */
const SCOPE_HIERARCHY: Record<string, number> = {
  readonly: 1,
  checkout: 2,
  full: 3,
};

/**
 * Guard for API v2 endpoints.
 * Validates `X-Api-Key` header (secret key), attaches project to request.
 * Optionally checks API key scope via @RequireScope decorator.
 */
@Injectable()
export class ApiKeyV2Guard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-Api-Key header');
    }

    const result = await this.apiKeyService.validateKeyWithMeta(apiKey, 'secret');
    if (!result) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    // Check scope if @RequireScope is set
    const requiredScope = this.reflector.get<string>(SCOPE_KEY, context.getHandler());
    if (requiredScope) {
      const keyLevel = SCOPE_HIERARCHY[result.scope] ?? 0;
      const requiredLevel = SCOPE_HIERARCHY[requiredScope] ?? 0;
      if (keyLevel < requiredLevel) {
        throw new ForbiddenException(`API key scope "${result.scope}" insufficient — requires "${requiredScope}"`);
      }
    }

    request.project = result.project;
    request.apiKeyId = result.keyId;
    return true;
  }
}
