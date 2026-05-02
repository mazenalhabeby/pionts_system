import { Injectable, Logger } from '@nestjs/common';
import { IPlatformAdapter, PlatformConfig, CreateDiscountResult } from '../platform.interface';

@Injectable()
export class GenericApiAdapter implements IPlatformAdapter {
  readonly platform = 'custom';
  private readonly logger = new Logger(GenericApiAdapter.name);

  async createDiscount(
    config: PlatformConfig,
    code: string,
    amount: number,
    currency?: string,
  ): Promise<CreateDiscountResult> {
    if (!config.apiUrl || !config.apiKey) {
      this.logger.warn(`Missing API credentials for project ${config.projectId}`);
      return { success: false, code };
    }

    try {
      const res = await fetch(`${config.apiUrl}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          code,
          type: 'FIXED_AMOUNT',
          value: amount,
          currency: currency || 'EUR',
          maxUses: 1,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Generic API discount creation failed: ${res.status} ${text}`);
        return { success: false, code };
      }

      const data = await res.json();
      return {
        success: true,
        externalId: data.id ? String(data.id) : undefined,
        code,
      };
    } catch (err) {
      this.logger.error(`Generic API discount creation error for project ${config.projectId}:`, err);
      return { success: false, code };
    }
  }

  async deleteDiscount(config: PlatformConfig, code: string): Promise<boolean> {
    if (!config.apiUrl || !config.apiKey) {
      this.logger.warn(`Missing API credentials for project ${config.projectId}`);
      return false;
    }

    try {
      const res = await fetch(`${config.apiUrl}/discounts/code/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      return res.ok;
    } catch (err) {
      this.logger.error(`Generic API discount deletion error for project ${config.projectId}:`, err);
      return false;
    }
  }

  async lookupCustomer(
    config: PlatformConfig,
    email: string,
  ): Promise<{ name?: string; externalId?: string } | null> {
    if (!config.apiUrl || !config.apiKey) {
      return null;
    }

    try {
      const res = await fetch(`${config.apiUrl}/users?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (!data || (Array.isArray(data) && data.length === 0)) return null;

      const user = Array.isArray(data) ? data[0] : data;
      return {
        name: user.name || undefined,
        externalId: user.id ? String(user.id) : undefined,
      };
    } catch (err) {
      this.logger.error(`Generic API customer lookup error for project ${config.projectId}:`, err);
      return null;
    }
  }
}
