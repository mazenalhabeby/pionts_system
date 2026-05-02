import { Injectable, Logger } from '@nestjs/common';
import { IPlatformAdapter, PlatformConfig, CreateDiscountResult } from '../platform.interface';
import { ShopifyApiService } from '../../shopify-app/shopify-api.service';

@Injectable()
export class ShopifyAdapter implements IPlatformAdapter {
  readonly platform = 'shopify';
  private readonly logger = new Logger(ShopifyAdapter.name);

  constructor(private readonly shopifyApi: ShopifyApiService) {}

  async createDiscount(
    config: PlatformConfig,
    code: string,
    amount: number,
    _currency?: string,
  ): Promise<CreateDiscountResult> {
    if (!config.shopDomain || !config.accessToken) {
      this.logger.warn(`Missing Shopify credentials for project ${config.projectId}`);
      return { success: false, code };
    }

    const success = await this.shopifyApi.createDiscountForShop(
      config.shopDomain,
      config.accessToken,
      code,
      amount,
    );

    return { success, code };
  }

  async deleteDiscount(config: PlatformConfig, code: string): Promise<boolean> {
    if (!config.shopDomain || !config.accessToken) {
      this.logger.warn(`Missing Shopify credentials for project ${config.projectId}`);
      return false;
    }

    return this.shopifyApi.deleteDiscountForShop(
      config.shopDomain,
      config.accessToken,
      code,
    );
  }

  async lookupCustomer(
    config: PlatformConfig,
    externalId: string,
  ): Promise<{ name?: string; externalId?: string } | null> {
    if (!config.shopDomain || !config.accessToken || !externalId) {
      return null;
    }

    const customer = await this.shopifyApi.getCustomerById(
      config.shopDomain,
      config.accessToken,
      externalId,
    );

    if (!customer) return null;

    return {
      name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || undefined,
      externalId,
    };
  }
}
