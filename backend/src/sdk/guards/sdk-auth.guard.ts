import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ApiKeyService } from '../../auth/api-key.service';
import { CustomersService } from '../../customers/customers.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SdkAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Validate API key → attach project
    const projectKey = request.headers['x-project-key'];
    if (!projectKey) throw new UnauthorizedException('Missing X-Project-Key header');

    const project = await this.apiKeyService.validateKey(projectKey, 'public');
    if (!project) throw new UnauthorizedException('Invalid API key');

    request.sdkProject = project;

    // 2. Try HMAC auth
    const email = request.headers['x-customer-email'];
    const hmac = request.headers['x-customer-hmac'];

    if (email && hmac) {
      if (!project.hmacSecret) {
        throw new UnauthorizedException('HMAC verification not configured for this project');
      }

      const expected = crypto
        .createHmac('sha256', project.hmacSecret)
        .update(email)
        .digest('hex');

      const hmacBuf = Buffer.from(hmac, 'hex');
      const expectedBuf = Buffer.from(expected, 'hex');

      if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
        throw new UnauthorizedException('Invalid HMAC signature');
      }

      const customer = await this.customersService.findByEmail(project.id, email);
      request.sdkCustomer = customer || null;
      request.sdkAuthMode = 'hmac';
      request.sdkCustomerEmail = email;
      return true;
    }

    // 3. Try Bearer token (SDK customer JWT)
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'dev-jwt-secret',
        });
        if (payload.type === 'sdk_customer' && payload.projectId === project.id) {
          const customer = await this.customersService.findByEmail(project.id, payload.email);
          request.sdkCustomer = customer || null;
          request.sdkAuthMode = 'token';
          request.sdkCustomerEmail = payload.email;
          return true;
        }
      } catch {
        // invalid token, fall through
      }
    }

    // 4. No customer identity — some endpoints still work
    request.sdkCustomer = null;
    request.sdkAuthMode = 'none';
    request.sdkCustomerEmail = null;
    return true;
  }
}
