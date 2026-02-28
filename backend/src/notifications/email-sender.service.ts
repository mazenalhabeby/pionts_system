import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailSenderService {
  private resend: Resend | null = null;
  private readonly defaultFrom: string;
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(private readonly configService: ConfigService) {
    this.defaultFrom = this.configService.get<string>('FROM_EMAIL') || 'Pionts <noreply@pionts.com>';
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged to console only');
    }
  }

  async send(to: string, subject: string, html: string, fromName?: string): Promise<boolean> {
    const from = fromName ? `${fromName} <noreply@pionts.com>` : this.defaultFrom;
    this.logger.log(`Email to ${to}: ${subject}`);

    if (!this.resend) {
      return true;
    }

    try {
      await this.resend.emails.send({ from, to, subject, html });
      return true;
    } catch (err) {
      this.logger.error('Failed to send email', err);
      return false;
    }
  }
}
