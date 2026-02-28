import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMembersService } from './project-members.service';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMembersService],
  exports: [ProjectMembersService],
})
export class ProjectsModule {}
