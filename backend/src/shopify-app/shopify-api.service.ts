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

  /**
   * Exchange a Shopify session token for an offline access token using Token Exchange.
   * https://shopify.dev/docs/apps/auth/get-access-tokens/token-exchange
   */
  async exchangeSessionToken(
    shop: string,
    sessionToken: string,
  ): Promise<{ accessToken: string; scope: string } | null> {
    try {
      const res = await this.fetchWithRetry(
        `https://${shop}/admin/oauth/access_token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
            subject_token: sessionToken,
            subject_token_type: 'urn:ietf:params:oauth:token-type:id-token',
            requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Token exchange failed for ${shop}: ${res.status} ${text}`);
        return null;
      }

      const data = await res.json();
      return { accessToken: data.access_token, scope: data.scope || '' };
    } catch (err) {
      this.logger.error(`Token exchange error for ${shop}:`, err);
      return null;
    }
  }

  /**
   * Get the shop's primary domain (e.g. "coolstore.com" or "coolstore.myshopify.com").
   */
  async getShopDomains(
    shop: string,
    accessToken: string,
  ): Promise<{ primaryDomain: string; myshopifyDomain: string } | null> {
    try {
      const res = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/shop.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const data = await res.json();
      if (!data.shop) return null;
      return {
        primaryDomain: data.shop.domain || shop,
        myshopifyDomain: data.shop.myshopify_domain || shop,
      };
    } catch (err) {
      this.logger.error(`Failed to get shop domains for ${shop}:`, err);
      return null;
    }
  }

  /**
   * Debug: read current theme blocks from settings_data.json
   */
  async getThemeBlocks(shop: string, accessToken: string): Promise<any> {
    try {
      const themesRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/themes.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const themesData = await themesRes.json();
      const mainTheme = themesData.themes?.find((t: any) => t.role === 'main');
      if (!mainTheme) return { error: 'No main theme found' };

      const assetRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const assetData = await assetRes.json();
      if (!assetData.asset?.value) return { error: 'Could not read settings_data.json' };

      const settings = JSON.parse(assetData.asset.value);
      const current = settings.current || {};
      const blocks = current.blocks || {};

      // Filter to show only app-related blocks
      const appBlocks = Object.entries(blocks)
        .filter(([_, v]: [string, any]) => typeof v.type === 'string' && v.type.includes('shopify://apps'))
        .map(([key, v]: [string, any]) => ({
          blockId: key,
          type: v.type,
          disabled: v.disabled,
          settings: v.settings,
        }));

      return {
        themeId: mainTheme.id,
        themeName: mainTheme.name,
        totalBlocks: Object.keys(blocks).length,
        appBlocks,
        allBlockTypes: Object.values(blocks).map((v: any) => v.type).filter(Boolean).slice(0, 20),
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * Auto-enable the theme app extension embed block in the active theme.
   * This makes the floating widget appear on the storefront immediately.
   */
  async enableThemeAppEmbed(
    shop: string,
    accessToken: string,
    appUuid: string,
  ): Promise<boolean> {
    try {
      // The block file name in our theme extension
      const blockFileName = 'loyalty-popup';

      this.logger.log(`Enabling theme app embed for ${shop}, looking for block containing "${blockFileName}"`);

      // 1. Get the main/active theme
      const themesRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/themes.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const themesData = await themesRes.json();
      const mainTheme = themesData.themes?.find((t: any) => t.role === 'main');
      if (!mainTheme) {
        this.logger.warn(`No main theme found for ${shop}`);
        return false;
      }

      // 2. Get the theme's settings_data.json
      const assetRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const assetData = await assetRes.json();
      if (!assetData.asset?.value) {
        this.logger.warn(`Could not read settings_data.json for ${shop}`);
        return false;
      }

      const settings = JSON.parse(assetData.asset.value);
      const current = settings.current || {};

      // 3. Find or create the blocks section and add the app embed
      if (!current.blocks) current.blocks = {};

      // Find existing block by matching on the block file name in the type string
      // Shopify format: shopify://apps/{handle}/blocks/{blockFile}/{uid}
      const existingBlock = Object.entries(current.blocks).find(
        ([_, v]: [string, any]) =>
          typeof v.type === 'string' &&
          v.type.includes('shopify://apps/') &&
          v.type.includes(`/blocks/${blockFileName}/`),
      );

      if (existingBlock) {
        // Already exists — make sure it's not disabled
        const [existingKey] = existingBlock;
        current.blocks[existingKey].disabled = false;
        this.logger.log(`Theme app embed already exists for ${shop}, ensuring enabled`);
      } else {
        // No existing block found — can't add one programmatically without knowing
        // the Shopify-assigned extension handle and block UID. The merchant needs to
        // enable it manually via the theme editor, or reinstall the app.
        this.logger.warn(
          `No existing loyalty-popup block found in theme for ${shop}. ` +
          `Merchant may need to enable it via Theme Editor > App embeds.`,
        );
        return false;
      }

      settings.current = current;

      // 4. Write back the updated settings_data.json
      const updateRes = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/themes/${mainTheme.id}/assets.json`,
        {
          method: 'PUT',
          headers: this.headers(accessToken),
          body: JSON.stringify({
            asset: {
              key: 'config/settings_data.json',
              value: JSON.stringify(settings),
            },
          }),
        },
      );

      if (!updateRes.ok) {
        const text = await updateRes.text();
        this.logger.error(`Failed to update theme settings for ${shop}: ${updateRes.status} ${text}`);
        return false;
      }

      this.logger.log(`Theme app embed enabled for ${shop} on theme ${mainTheme.name}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to enable theme app embed for ${shop}:`, err);
      return false;
    }
  }

  async getShopInfo(shop: string, accessToken: string): Promise<{ name: string; email: string } | null> {
    try {
      const res = await this.fetchWithRetry(
        `https://${shop}/admin/api/${API_VERSION}/shop.json`,
        { method: 'GET', headers: this.headers(accessToken) },
      );
      const data = await res.json();
      return data.shop ? { name: data.shop.name, email: data.shop.email || '' } : null;
    } catch (err) {
      this.logger.error(`Failed to get shop info for ${shop}:`, err);
      return null;
    }
  }
}
