import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailSenderService {
  private transporter: Transporter | null = null;
  private readonly defaultFrom: string;
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(private readonly configService: ConfigService) {
    this.defaultFrom = this.configService.get<string>('SMTP_FROM_EMAIL')
      || this.configService.get<string>('FROM_EMAIL')
      || 'Pionts <noreply@pionts.com>';
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    const host = this.configService.get<string>('SMTP_HOST');
    if (isDev) {
      this.logger.warn('Development mode — emails will be logged to console only');
    } else if (host) {
      const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465,
        auth: {
          user: this.configService.get<string>('SMTP_USER') || '',
          pass: this.configService.get<string>('SMTP_PASS') || '',
        },
      });
    } else {
      this.logger.warn('SMTP_HOST not set — emails will be logged to console only');
    }
  }

  async send(to: string, subject: string, html: string, fromName?: string): Promise<boolean> {
    const fromEmail = this.defaultFrom.match(/<(.+)>/)?.[1] || this.defaultFrom;
    const from = fromName ? `${fromName} <${fromEmail}>` : this.defaultFrom;
    this.logger.log(`Email to ${to}: ${subject}`);

    if (!this.transporter) {
      return true;
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.transporter.sendMail({ from, to, subject, html });
        return true;
      } catch (err) {
        this.logger.error(`Failed to send email (attempt ${attempt}/2)`, err);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return false;
  }
}
