import { Injectable, Logger } from '@nestjs/common';
import { EmailSenderService } from '../notifications/email-sender.service';
import { EmailTemplateService } from '../notifications/email-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly emailSender: EmailSenderService,
    private readonly emailTemplate: EmailTemplateService,
  ) {}

  async sendVerificationCode(to: string, code: string, brandName?: string, primaryColor?: string): Promise<boolean> {
    this.logger.log(`Verification code for ${to}: ${code}`);

    const template = this.emailTemplate.verificationCode(
      brandName || '8BC Crew',
      primaryColor || '#ff3c00',
      code,
    );

    return this.emailSender.send(to, template.subject, template.html);
  }
}
