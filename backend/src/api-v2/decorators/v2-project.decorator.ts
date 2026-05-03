import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the project attached by ApiKeyV2Guard.
 * Usage: `@V2Project() project: Project`
 */
export const V2Project = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().project;
  },
);
