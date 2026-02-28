import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/common/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  function createMockContext(user: any): ExecutionContext {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when user role is in required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner', 'admin']);
    const context = createMockContext({ id: 1, role: 'owner' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user role not in required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner', 'admin']);
    const context = createMockContext({ id: 1, role: 'member' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow all when no @Roles decorator present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ id: 1, role: 'member' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner']);
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
