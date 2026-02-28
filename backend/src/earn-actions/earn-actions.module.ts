import { Global, Module } from '@nestjs/common';
import { EarnActionsService } from './earn-actions.service';
import { EarnActionsController } from './earn-actions.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [EarnActionsController],
  providers: [EarnActionsService],
  exports: [EarnActionsService],
})
export class EarnActionsModule {}
