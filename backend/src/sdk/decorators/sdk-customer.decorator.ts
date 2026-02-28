import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SdkCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().sdkCustomer;
  },
);

export const SdkProject = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().sdkProject;
  },
);
