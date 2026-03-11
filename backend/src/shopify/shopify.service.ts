import { Injectable, Logger } from '@nestjs/common';

const SHOPIFY_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  private get store() {
    return process.env.SHOPIFY_STORE;
  }

  private get token() {
    return process.env.SHOPIFY_ACCESS_TOKEN;
  }

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

  async createDiscount(code: string, amount: number): Promise<boolean> {
    if (!this.token || !this.store) return false;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token,
      };

      const priceRuleRes = await this.fetchWithRetry(
        `https://${this.store}/admin/api/2024-01/price_rules.json`,
        {
          method: 'POST',
          headers,
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
        `https://${this.store}/admin/api/2024-01/price_rules/${data.price_rule.id}/discount_codes.json`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ discount_code: { code } }),
        },
      );

      return true;
    } catch (err) {
      this.logger.error('Shopify discount creation failed:', err);
      return false;
    }
  }

  async deleteDiscount(code: string): Promise<boolean> {
    if (!this.token || !this.store) return false;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token,
      };

      // Look up discount code to get its price_rule_id
      const lookupRes = await this.fetchWithRetry(
        `https://${this.store}/admin/api/2024-01/discount_codes/lookup.json?code=${encodeURIComponent(code)}`,
        { method: 'GET', headers },
      );

      if (!lookupRes.ok) return false;
      const lookupData = await lookupRes.json();
      const priceRuleId = lookupData?.discount_code?.price_rule_id;
      if (!priceRuleId) return false;

      // Delete the price rule (cascades to discount code)
      const deleteRes = await this.fetchWithRetry(
        `https://${this.store}/admin/api/2024-01/price_rules/${priceRuleId}.json`,
        { method: 'DELETE', headers },
      );

      return deleteRes.ok;
    } catch (err) {
      this.logger.error('Shopify discount deletion failed:', err);
      return false;
    }
  }
}
