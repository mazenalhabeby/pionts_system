import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const publicKey = request.headers['x-project-key'] as string;
    const secretKey = request.headers['x-secret-key'] as string;

    const rawKey = publicKey || secretKey;
    if (!rawKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const type = publicKey ? 'public' : 'secret';
    const project = await this.apiKeyService.validateKey(rawKey, type);
    if (!project) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.project = project;
    return true;
  }
}
