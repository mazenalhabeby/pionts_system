import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IPlatformAdapter, PlatformConfig } from './platform.interface';
import { ShopifyAdapter } from './adapters/shopify.adapter';
import { GenericApiAdapter } from './adapters/generic-api.adapter';

@Injectable()
export class PlatformFactory {
  private readonly logger = new Logger(PlatformFactory.name);
  private readonly adapters: Map<string, IPlatformAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopifyAdapter: ShopifyAdapter,
    private readonly genericApiAdapter: GenericApiAdapter,
  ) {
    this.adapters = new Map<string, IPlatformAdapter>([
      ['shopify', this.shopifyAdapter],
      ['custom', this.genericApiAdapter],
      ['wordpress', this.genericApiAdapter],
      ['other', this.genericApiAdapter],
    ]);
  }

  getAdapter(platform: string): IPlatformAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      this.logger.warn(`No adapter for platform "${platform}", falling back to generic`);
      return this.genericApiAdapter;
    }
    return adapter;
  }

  async getConfig(projectId: number): Promise<PlatformConfig> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        platform: true,
        platformApiUrl: true,
        platformApiKey: true,
        platformWebhookSecret: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const config: PlatformConfig = {
      projectId: project.id,
      platform: project.platform,
      apiUrl: project.platformApiUrl || undefined,
      apiKey: project.platformApiKey || undefined,
      webhookSecret: project.platformWebhookSecret || undefined,
    };

    // For Shopify projects, enrich with ShopifyInstallation credentials
    if (project.platform === 'shopify') {
      const installation = await this.prisma.shopifyInstallation.findUnique({
        where: { projectId },
        select: { shopDomain: true, accessToken: true, uninstalledAt: true },
      });

      if (installation && !installation.uninstalledAt) {
        config.shopDomain = installation.shopDomain;
        config.accessToken = installation.accessToken;
      }
    }

    return config;
  }
}
