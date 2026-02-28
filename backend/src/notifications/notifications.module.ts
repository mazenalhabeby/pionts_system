import { Module } from '@nestjs/common';
import { EmailSenderService } from './email-sender.service';
import { EmailTemplateService } from './email-template.service';
import { NotificationService } from './notification.service';

@Module({
  providers: [EmailSenderService, EmailTemplateService, NotificationService],
  exports: [NotificationService, EmailSenderService, EmailTemplateService],
})
export class NotificationsModule {}
