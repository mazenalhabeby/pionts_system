import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { ShopifyApiService } from './shopify-api.service';

@Injectable()
export class ShopifyAppService {
  private readonly logger = new Logger(ShopifyAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly shopifyApi: ShopifyApiService,
  ) {}

  async provisionStore(
    shopDomain: string,
    accessToken: string,
    scopes: string,
  ): Promise<{ projectId: number; orgId: number }> {
    // Check for existing installation (reinstall → reactivate)
    const existing = await this.prisma.shopifyInstallation.findUnique({
      where: { shopDomain },
    });

    if (existing) {
      await this.prisma.shopifyInstallation.update({
        where: { id: existing.id },
        data: {
          accessToken,
          scopes,
          uninstalledAt: null,
        },
      });

      // Re-register webhooks with new token
      await this.registerWebhooks(shopDomain, accessToken, existing.id);

      // Update metafields (token may have changed)
      if (existing.publicKey) {
        await this.setShopMetafields(shopDomain, accessToken, existing.publicKey, existing.hmacSecret);
      }

      this.logger.log(`Reinstalled Shopify app for ${shopDomain} (project ${existing.projectId})`);
      return { projectId: existing.projectId, orgId: existing.orgId };
    }

    // Get shop name for org/project naming
    const shopInfo = await this.shopifyApi.getShopInfo(shopDomain, accessToken);
    const shopName = shopInfo?.name || shopDomain.replace('.myshopify.com', '');

    // Create Organization
    const slug = shopDomain.replace('.myshopify.com', '').replace(/[^a-z0-9-]/g, '-');
    const org = await this.prisma.organization.create({
      data: {
        name: shopName,
        slug: `${slug}-${Date.now().toString(36)}`,
      },
    });

    // Create free subscription
    await this.prisma.subscription.create({
      data: {
        orgId: org.id,
        stripeCustomerId: `cus_shopify_${org.id}`,
        plan: 'free',
        status: 'active',
      },
    });

    // Create Project via ProjectsService (generates API keys, seeds defaults)
    const { project, keys } = await this.projectsService.create(
      org.id,
      `${shopName} Rewards`,
      shopDomain,
      'shopify',
    );

    // Save installation with raw keys for Liquid templates
    const installation = await this.prisma.shopifyInstallation.create({
      data: {
        shopDomain,
        accessToken,
        scopes,
        projectId: project.id,
        orgId: org.id,
        publicKey: keys.publicKey,
        hmacSecret: project.hmacSecret,
      },
    });

    // Register Shopify webhooks
    await this.registerWebhooks(shopDomain, accessToken, installation.id);

    // Set shop metafields for Liquid templates
    await this.setShopMetafields(shopDomain, accessToken, keys.publicKey, project.hmacSecret);

    this.logger.log(`Provisioned Shopify store ${shopDomain} → org ${org.id}, project ${project.id}`);
    return { projectId: project.id, orgId: org.id };
  }

  private async registerWebhooks(
    shopDomain: string,
    accessToken: string,
    installationId: number,
  ): Promise<void> {
    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL || 'https://app.pionts.com';
    const webhookBase = `${appUrl}/shopify/webhooks`;

    const topics: Array<{ topic: string; path: string }> = [
      { topic: 'orders/create', path: 'orders-create' },
      { topic: 'refunds/create', path: 'refunds-create' },
      { topic: 'app/uninstalled', path: 'app-uninstalled' },
    ];

    const ids: string[] = [];
    for (const { topic, path } of topics) {
      const webhookId = await this.shopifyApi.registerWebhook(
        shopDomain,
        accessToken,
        topic,
        `${webhookBase}/${path}`,
      );
      if (webhookId) ids.push(webhookId);
    }

    await this.prisma.shopifyInstallation.update({
      where: { id: installationId },
      data: { webhookIds: JSON.stringify(ids) },
    });
  }

  private async setShopMetafields(
    shopDomain: string,
    accessToken: string,
    publicKey: string | null,
    hmacSecret: string | null,
  ): Promise<void> {
    const appUrl = process.env.SHOPIFY_APP_URL || process.env.APP_URL || 'https://app.pionts.com';

    if (publicKey) {
      await this.shopifyApi.setMetafield(shopDomain, accessToken, 'pionts', 'public_key', publicKey);
    }
    if (hmacSecret) {
      await this.shopifyApi.setMetafield(shopDomain, accessToken, 'pionts', 'hmac_secret', hmacSecret);
    }
    await this.shopifyApi.setMetafield(shopDomain, accessToken, 'pionts', 'api_url', appUrl);
  }

  async handleUninstall(shopDomain: string): Promise<void> {
    const installation = await this.prisma.shopifyInstallation.findUnique({
      where: { shopDomain },
    });

    if (installation) {
      await this.prisma.shopifyInstallation.update({
        where: { id: installation.id },
        data: { uninstalledAt: new Date() },
      });
      this.logger.log(`Shopify app uninstalled for ${shopDomain}`);
    }
  }

  async getInstallationByShop(shopDomain: string) {
    return this.prisma.shopifyInstallation.findUnique({
      where: { shopDomain },
    });
  }
}
