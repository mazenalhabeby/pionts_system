import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WEBHOOK_QUEUE, WebhookEvent } from './webhooks-v2.service';

const TIMEOUT_MS = 10_000;

@Processor(WEBHOOK_QUEUE)
export class WebhookDeliveryProcessor {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process()
  async handleDelivery(job: Job<WebhookEvent>): Promise<void> {
    const { url, secret, payload, eventId, eventType, endpointId } = job.data;

    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pionts-Signature': `sha256=${signature}`,
          'X-Pionts-Event-Id': eventId,
          'X-Pionts-Event-Type': eventType,
        },
        body,
        signal: controller.signal,
      });

      if (res.ok) {
        await this.prisma.webhookDelivery.update({
          where: { eventId },
          data: {
            status: 'delivered',
            attempts: job.attemptsMade + 1,
            deliveredAt: new Date(),
          },
        });
        this.logger.log(`Webhook delivered: ${eventType} → ${url} (${eventId})`);
      } else {
        const errorText = await res.text().catch(() => '');
        const error = `HTTP ${res.status}: ${errorText.substring(0, 200)}`;
        await this.updateAttempt(eventId, job.attemptsMade + 1, error);
        throw new Error(error);
      }
    } catch (err: any) {
      const message = err.name === 'AbortError' ? 'Timeout' : err.message;
      await this.updateAttempt(eventId, job.attemptsMade + 1, message);
      throw err; // Bull will retry based on attempts config
    } finally {
      clearTimeout(timer);
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job<WebhookEvent>, error: Error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await this.prisma.webhookDelivery.update({
        where: { eventId: job.data.eventId },
        data: { status: 'failed' },
      });
      this.logger.warn(
        `Webhook permanently failed: ${job.data.eventType} → ${job.data.url} after ${job.attemptsMade} attempts: ${error.message}`,
      );
    }
  }

  private async updateAttempt(eventId: string, attempts: number, error: string) {
    await this.prisma.webhookDelivery.update({
      where: { eventId },
      data: { attempts, lastError: error.substring(0, 500) },
    }).catch(() => {}); // Don't fail the job on DB error
  }
}
