import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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
  ): Promise<{ projectId: number; orgId: number; userId?: number }> {
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

      // Auto-create/link user on reinstall too
      let userId: number | undefined;
      const shopInfo = await this.shopifyApi.getShopInfo(shopDomain, accessToken);
      const reinstallEmail = shopInfo?.email || '';
      if (reinstallEmail) {
        try {
          const existingUser = await this.prisma.user.findUnique({ where: { email: reinstallEmail } });
          if (existingUser) {
            const existingMembership = await this.prisma.orgMembership.findUnique({
              where: { userId_orgId: { userId: existingUser.id, orgId: existing.orgId } },
            });
            if (!existingMembership) {
              await this.prisma.orgMembership.create({
                data: { userId: existingUser.id, orgId: existing.orgId, role: 'owner' },
              });
              await this.prisma.projectMember.create({
                data: { projectId: existing.projectId, userId: existingUser.id, role: 'owner' },
              });
            }
            userId = existingUser.id;
          } else {
            const tempPassword = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            const user = await this.prisma.user.create({
              data: { email: reinstallEmail, passwordHash, name: shopInfo?.name || shopDomain },
            });
            await this.prisma.orgMembership.create({
              data: { userId: user.id, orgId: existing.orgId, role: 'owner' },
            });
            await this.prisma.projectMember.create({
              data: { projectId: existing.projectId, userId: user.id, role: 'owner' },
            });
            userId = user.id;
            this.logger.log(`Auto-created dashboard user ${reinstallEmail} for ${shopDomain} (reinstall)`);
          }
        } catch (err: any) {
          this.logger.error(`Failed to auto-create user on reinstall for ${shopDomain}:`, err.message);
        }
      }

      // Re-enable floating widget in active theme on reinstall
      await this.enableThemeEmbed(shopDomain, accessToken);

      // Re-apply project settings from Shopify data
      await this.autoConfigureProjectSettings(existing.projectId, shopDomain, accessToken);

      this.logger.log(`Reinstalled Shopify app for ${shopDomain} (project ${existing.projectId})`);
      return { projectId: existing.projectId, orgId: existing.orgId, userId };
    }

    // Get shop name + email for org/project naming and user creation
    const shopInfo = await this.shopifyApi.getShopInfo(shopDomain, accessToken);
    const shopName = shopInfo?.name || shopDomain.replace('.myshopify.com', '');
    const shopEmail = shopInfo?.email || '';

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

    // Auto-create a dashboard user from the Shopify store owner email
    let userId: number | undefined;
    if (shopEmail) {
      try {
        const existingUser = await this.prisma.user.findUnique({ where: { email: shopEmail } });
        if (existingUser) {
          // User already exists — link them to this org
          const existingMembership = await this.prisma.orgMembership.findUnique({
            where: { userId_orgId: { userId: existingUser.id, orgId: org.id } },
          });
          if (!existingMembership) {
            await this.prisma.orgMembership.create({
              data: { userId: existingUser.id, orgId: org.id, role: 'owner' },
            });
            await this.prisma.projectMember.create({
              data: { projectId: project.id, userId: existingUser.id, role: 'owner' },
            });
          }
          userId = existingUser.id;
        } else {
          // Create new user with a random password (they can reset via dashboard)
          const tempPassword = crypto.randomBytes(16).toString('hex');
          const passwordHash = await bcrypt.hash(tempPassword, 10);
          const user = await this.prisma.user.create({
            data: {
              email: shopEmail,
              passwordHash,
              name: shopName,
            },
          });
          await this.prisma.orgMembership.create({
            data: { userId: user.id, orgId: org.id, role: 'owner' },
          });
          await this.prisma.projectMember.create({
            data: { projectId: project.id, userId: user.id, role: 'owner' },
          });
          userId = user.id;
          this.logger.log(`Auto-created dashboard user ${shopEmail} for ${shopDomain}`);
        }
      } catch (err: any) {
        this.logger.error(`Failed to auto-create user for ${shopDomain}:`, err.message);
      }
    }

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

    // Auto-set project settings from Shopify data (referral URL, store domain)
    await this.autoConfigureProjectSettings(project.id, shopDomain, accessToken);

    // Auto-enable floating widget in active theme
    await this.enableThemeEmbed(shopDomain, accessToken);

    this.logger.log(`Provisioned Shopify store ${shopDomain} → org ${org.id}, project ${project.id}`);
    return { projectId: project.id, orgId: org.id, userId };
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

  /**
   * Log that the merchant needs to manually enable the theme app embed.
   * Shopify requires a special exemption to modify theme files via API,
   * so we can't auto-enable — the merchant must toggle it in their theme editor.
   */
  private async enableThemeEmbed(shopDomain: string, _accessToken: string): Promise<void> {
    this.logger.log(
      `Theme app embed for ${shopDomain}: merchant must enable via Theme Editor > App embeds. ` +
      `Shopify does not allow API theme file modifications without an exemption.`,
    );
  }

  /**
   * Auto-configure key project settings from Shopify shop data.
   * Sets referral_base_url, social links domain, etc.
   */
  private async autoConfigureProjectSettings(
    projectId: number,
    shopDomain: string,
    accessToken: string,
  ): Promise<void> {
    try {
      const domains = await this.shopifyApi.getShopDomains(shopDomain, accessToken);
      const primaryDomain = domains?.primaryDomain || shopDomain.replace('.myshopify.com', '.com');
      const storeUrl = `https://${primaryDomain}`;

      // Settings to auto-configure (only set if not already customized)
      const autoSettings: Array<{ key: string; value: string }> = [
        { key: 'referral_base_url', value: storeUrl },
      ];

      for (const { key, value } of autoSettings) {
        const existing = await this.prisma.setting.findUnique({
          where: { projectId_key: { projectId, key } },
        });

        if (!existing || !existing.value) {
          await this.prisma.setting.upsert({
            where: { projectId_key: { projectId, key } },
            update: { value },
            create: { projectId, key, value },
          });
          this.logger.log(`Auto-set ${key} = ${value} for project ${projectId}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to auto-configure project settings for project ${projectId}:`, err.message);
    }
  }
}
