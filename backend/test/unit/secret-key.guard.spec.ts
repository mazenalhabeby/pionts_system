import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SecretKeyGuard } from '../../src/common/guards/secret-key.guard';

describe('SecretKeyGuard', () => {
  let guard: SecretKeyGuard;
  let mockApiKeyService: { validateKey: jest.Mock };

  function createMockContext(headers: Record<string, string> = {}): ExecutionContext {
    const request = { headers, project: undefined };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    mockApiKeyService = { validateKey: jest.fn() };
    guard = new SecretKeyGuard(mockApiKeyService as any);
  });

  it('should allow valid secret key and attach project', async () => {
    const project = { id: 1, name: 'Test' };
    mockApiKeyService.validateKey.mockResolvedValue(project);

    const ctx = createMockContext({ 'x-secret-key': 'sk_live_abc123' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockApiKeyService.validateKey).toHaveBeenCalledWith('sk_live_abc123', 'secret');
    const request = ctx.switchToHttp().getRequest() as any;
    expect(request.project).toEqual(project);
  });

  it('should reject missing key with 401', async () => {
    const ctx = createMockContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject public key with 401', async () => {
    const ctx = createMockContext({ 'x-secret-key': 'pk_live_abc123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockApiKeyService.validateKey).not.toHaveBeenCalled();
  });

  it('should reject revoked/invalid key with 401', async () => {
    mockApiKeyService.validateKey.mockResolvedValue(null);

    const ctx = createMockContext({ 'x-secret-key': 'sk_live_revoked' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
