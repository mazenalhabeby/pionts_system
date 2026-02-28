import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { EmailSenderService } from './email-sender.service';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
    private readonly emailSender: EmailSenderService,
    private readonly emailTemplate: EmailTemplateService,
  ) {}

  private getBrandConfig(projectId: number) {
    return {
      brandName: this.configService.get(projectId, 'widget_brand_name'),
      primaryColor: this.configService.get(projectId, 'widget_primary_color'),
      fromName: this.configService.get(projectId, 'email_from_name'),
    };
  }

  async onCustomerSignup(projectId: number, customer: { email: string; name?: string | null }, signupPoints: number) {
    const enabled = this.configService.get(projectId, 'email_welcome_enabled');
    if (enabled !== 'true') return;

    const { brandName, primaryColor, fromName } = this.getBrandConfig(projectId);
    const template = this.emailTemplate.welcome(
      customer.name || '',
      brandName,
      primaryColor,
      signupPoints,
    );

    await this.emailSender.send(customer.email, template.subject, template.html, fromName || undefined);
  }

  async onPointsEarned(
    projectId: number,
    customer: { id: number; email: string; name?: string | null },
    points: number,
    type: string,
    newBalance: number,
  ) {
    const mode = this.configService.get(projectId, 'email_notification_mode');
    if (mode === 'off') return;

    const { brandName, primaryColor, fromName } = this.getBrandConfig(projectId);
    const template = this.emailTemplate.pointsEarned(
      customer.name || '',
      brandName,
      primaryColor,
      points,
      type,
      newBalance,
    );

    if (mode === 'instant') {
      await this.emailSender.send(customer.email, template.subject, template.html, fromName || undefined);
    } else if (mode === 'digest') {
      await this.prisma.emailQueue.create({
        data: {
          projectId,
          customerId: customer.id,
          type: 'points_earned',
          payload: JSON.stringify({ points, type, newBalance }),
        },
      });
    }
  }

  async onReferralUsed(
    projectId: number,
    referrer: { email: string; name?: string | null },
    referredName: string,
    pointsEarned: number,
  ) {
    const enabled = this.configService.get(projectId, 'email_referral_enabled');
    if (enabled !== 'true') return;

    const { brandName, primaryColor, fromName } = this.getBrandConfig(projectId);
    const template = this.emailTemplate.referralNotification(
      referrer.name || '',
      brandName,
      primaryColor,
      referredName,
      pointsEarned,
    );

    await this.emailSender.send(referrer.email, template.subject, template.html, fromName || undefined);
  }
}
