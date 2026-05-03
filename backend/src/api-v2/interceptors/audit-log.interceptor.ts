import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Interceptor that logs every API v2 request to the audit_logs table.
 * Captures: projectId, keyId, endpoint, method, IP, status, duration.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response.statusCode, Date.now() - start),
        error: (err) => this.log(request, err.status ?? 500, Date.now() - start),
      }),
    );
  }

  private log(request: any, status: number, duration: number) {
    const projectId = request.project?.id;
    if (!projectId) return; // Skip non-authenticated requests

    this.prisma.auditLog.create({
      data: {
        projectId,
        keyId: request.apiKeyId ?? null,
        endpoint: request.url,
        method: request.method,
        ip: request.ip ?? request.headers['x-forwarded-for'] ?? null,
        status,
        duration,
      },
    }).catch(() => {}); // Fire-and-forget — don't block the response
  }
}
