import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ShopifyAppService } from './shopify-app.service';

@Injectable()
export class ShopifyWebhookService {
  private readonly logger = new Logger(ShopifyWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
    private readonly shopifyAppService: ShopifyAppService,
  ) {}

  private async resolveProjectId(shopDomain: string): Promise<number> {
    const installation = await this.prisma.shopifyInstallation.findUnique({
      where: { shopDomain },
    });

    if (!installation || installation.uninstalledAt) {
      throw new NotFoundException(`No active installation for ${shopDomain}`);
    }

    return installation.projectId;
  }

  async handleOrderCreated(shopDomain: string, body: any) {
    const projectId = await this.resolveProjectId(shopDomain);
    this.logger.log(`Shopify order webhook for ${shopDomain} (project ${projectId})`);
    return this.webhooksService.processOrder(projectId, body);
  }

  async handleRefundCreated(shopDomain: string, body: any) {
    const projectId = await this.resolveProjectId(shopDomain);
    this.logger.log(`Shopify refund webhook for ${shopDomain} (project ${projectId})`);
    return this.webhooksService.processRefund(projectId, body);
  }

  async handleAppUninstalled(shopDomain: string) {
    this.logger.log(`Shopify app uninstalled for ${shopDomain}`);
    await this.shopifyAppService.handleUninstall(shopDomain);
    return { status: 'uninstalled' };
  }
}
