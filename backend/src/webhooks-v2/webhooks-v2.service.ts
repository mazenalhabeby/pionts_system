import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export const WEBHOOK_QUEUE = 'webhook-delivery';

export interface WebhookEvent {
  endpointId: number;
  eventType: string;
  eventId: string;
  payload: Record<string, unknown>;
  url: string;
  secret: string;
}

@Injectable()
export class WebhooksV2Service {
  private readonly logger = new Logger(WebhooksV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  /**
   * Emit a webhook event to all registered endpoints for a project.
   */
  async emit(projectId: number, eventType: string, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        projectId,
        active: true,
        events: { has: eventType },
      },
    });

    if (endpoints.length === 0) return;

    for (const endpoint of endpoints) {
      const eventId = crypto.randomUUID();

      // Create delivery record
      await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          eventType,
          eventId,
          payload: payload as any,
          status: 'pending',
        },
      });

      // Enqueue for async delivery
      await this.webhookQueue.add(
        {
          endpointId: endpoint.id,
          eventType,
          eventId,
          payload,
          url: endpoint.url,
          secret: endpoint.secret,
        } satisfies WebhookEvent,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.debug(`Queued webhook ${eventType} → ${endpoint.url} (${eventId})`);
    }
  }

  // ==================== CRUD ====================

  async registerEndpoint(projectId: number, url: string, events: string[]) {
    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: { projectId, url, events, secret },
      select: { id: true, url: true, events: true, secret: true, active: true, createdAt: true },
    });

    return endpoint;
  }

  async listEndpoints(projectId: number) {
    return this.prisma.webhookEndpoint.findMany({
      where: { projectId },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteEndpoint(projectId: number, endpointId: number) {
    await this.prisma.webhookEndpoint.deleteMany({
      where: { id: endpointId, projectId },
    });
  }

  async getDeliveryLogs(endpointId: number, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { endpointId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        eventId: true,
        status: true,
        attempts: true,
        lastError: true,
        deliveredAt: true,
        createdAt: true,
      },
    });
  }

  async sendTestEvent(projectId: number, endpointId: number) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, projectId },
    });
    if (!endpoint) return { success: false, error: 'Endpoint not found' };

    const eventId = `test_${crypto.randomUUID()}`;
    const payload = {
      event: 'test',
      message: 'This is a test webhook from Pionts',
      timestamp: new Date().toISOString(),
    };

    await this.webhookQueue.add(
      {
        endpointId: endpoint.id,
        eventType: 'test',
        eventId,
        payload,
        url: endpoint.url,
        secret: endpoint.secret,
      } satisfies WebhookEvent,
      { attempts: 1 },
    );

    return { success: true, eventId };
  }
}
