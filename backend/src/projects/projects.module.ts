import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMembersService } from './project-members.service';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { WebhooksV2Module } from '../webhooks-v2/webhooks-v2.module';

@Module({
  imports: [AuthModule, BillingModule, WebhooksV2Module],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMembersService],
  exports: [ProjectsService, ProjectMembersService],
})
export class ProjectsModule {}
