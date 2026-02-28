import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SecretKeyProject = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().project,
);
