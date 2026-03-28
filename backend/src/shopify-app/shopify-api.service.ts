import { Injectable, Logger } from '@nestjs/common';

const SHOPIFY_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const API_VERSION = '2024-01';

@Injectable()
export class ShopifyApiService {
  private readonly logger = new Logger(ShopifyApiService.name);

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SHOPIFY_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await this.fetchWithTimeout(url, options);
        if (res.status === 429 || res.status >= 500) {
          if (attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 500;
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
        }
        return res;
      } catch (err: any) {
        if (attempt < MAX_RETRIES && (err.name === 'AbortError' || err.code === 'ECONNRESET')) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Shopify API request failed after retries');
  }

  private headers(accessToken: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    };
  }

  async exchangeCodeForToken(
    shop: string,
    code: string,
  ): Promise<{ accessToken: string; scope: string }> {
    const res = await this.fetchWithRetry(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token exchange failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return { accessToken: data.access_token, scope: data.scope };
  }

  async registerWebhook(
    shop: string,
    accessToken: string,
    topic: string,
    address: string,
  ): Promise<string | null> {
    try {
      const res = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/webhooks.json`,
        {
          method: 'POST',
          headers: this.headers(accessToken),
          body: JSON.stringify({
            webhook: { topic, address, format: 'json' },
          }),
        },
      );

      const data = await res.json();
      return data.webhook?.id ? String(data.webhook.id) : null;
    } catch (err) {
      this.logger.error(`Failed to register webhook ${topic} for ${shop}:`, err);
      return null;
    }
  }

  async setMetafield(
    shop: string,
    accessToken: string,
    namespace: string,
    key: string,
    value: string,
    type = 'single_line_text_field',
  ): Promise<void> {
    try {
      await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/metafields.json`,
        {
          method: 'POST',
          headers: this.headers(accessToken),
          body: JSON.stringify({
            metafield: {
              namespace,
              key,
              value,
              type,
              owner_resource: 'shop',
            },
          }),
        },
      );
    } catch (err) {
      this.logger.error(`Failed to set metafield ${namespace}.${key} for ${shop}:`, err);
    }
  }

  async createDiscountForShop(
    shop: string,
    accessToken: string,
    code: string,
    amount: number,
  ): Promise<boolean> {
    try {
      const priceRuleRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/price_rules.json`,
        {
          method: 'POST',
          headers: this.headers(accessToken),
          body: JSON.stringify({
            price_rule: {
              title: code,
              value_type: 'fixed_amount',
              value: `-${amount}`,
              customer_selection: 'all',
              target_type: 'line_item',
              target_selection: 'all',
              allocation_method: 'across',
              usage_limit: 1,
              once_per_customer: true,
              starts_at: new Date().toISOString(),
            },
          }),
        },
      );

      const data = await priceRuleRes.json();
      if (!data.price_rule) return false;

      await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/price_rules/${data.price_rule.id}/discount_codes.json`,
        {
          method: 'POST',
          headers: this.headers(accessToken),
          body: JSON.stringify({ discount_code: { code } }),
        },
      );

      return true;
    } catch (err) {
      this.logger.error(`Shopify discount creation failed for ${shop}:`, err);
      return false;
    }
  }

  async deleteDiscountForShop(
    shop: string,
    accessToken: string,
    code: string,
  ): Promise<boolean> {
    try {
      const lookupRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/discount_codes/lookup.json?code=${encodeURIComponent(code)}`,
        { method: 'GET', headers: this.headers(accessToken) },
      );

      if (!lookupRes.ok) return false;
      const lookupData = await lookupRes.json();
      const priceRuleId = lookupData?.discount_code?.price_rule_id;
      if (!priceRuleId) return false;

      const deleteRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/price_rules/${priceRuleId}.json`,
        { method: 'DELETE', headers: this.headers(accessToken) },
      );

      return deleteRes.ok;
    } catch (err) {
      this.logger.error(`Shopify discount deletion failed for ${shop}:`, err);
      return false;
    }
  }

  async getCustomerById(
    shop: string,
    accessToken: string,
    customerId: string,
  ): Promise<{ email: string; firstName: string; lastName: string } | null> {
    try {
      const res = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/customers/${customerId}.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.customer?.email) return null;
      return {
        email: data.customer.email,
        firstName: data.customer.first_name || '',
        lastName: data.customer.last_name || '',
      };
    } catch (err) {
      this.logger.error(`Failed to get customer ${customerId} for ${shop}:`, err);
      return null;
    }
  }

  async getShopInfo(shop: string, accessToken: string): Promise<{ name: string } | null> {
    try {
      const res = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/shop.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const data = await res.json();
      return data.shop ? { name: data.shop.name } : null;
    } catch (err) {
      this.logger.error(`Failed to get shop info for ${shop}:`, err);
      return null;
    }
  }
}
