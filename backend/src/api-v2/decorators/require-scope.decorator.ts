import { SetMetadata } from '@nestjs/common';

export const SCOPE_KEY = 'requiredScope';

/**
 * Decorator to require a specific API key scope on v2 endpoints.
 * Used with ApiKeyV2Guard which checks the scope.
 *
 * @example
 * ```typescript
 * @RequireScope('checkout')
 * @Post('checkout/validate')
 * ```
 */
export const RequireScope = (scope: string) => SetMetadata(SCOPE_KEY, scope);
