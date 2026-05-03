import { PiontsError, PiontsTimeoutError } from './errors';
import type {
  PiontsClientOptions,
  ValidateResult,
  MarkUsedResult,
  OrderPaidData,
  OrderPaidResult,
  CustomerData,
  RedeemResult,
  CancelResult,
  ProjectConfig,
  WidgetInitData,
} from './types';

const DEFAULT_TIMEOUT = 10_000;
const RETRY_DELAY = 1000;

/**
 * Pionts SDK client for server-side integration.
 *
 * @example
 * ```typescript
 * import { PiontsClient } from '@pionts/sdk';
 *
 * const pionts = new PiontsClient({
 *   apiUrl: 'https://pionts.example.com/api/v2',
 *   secretKey: 'sk_live_...',
 * });
 *
 * // Validate a discount code at checkout
 * const result = await pionts.checkout.validate('CODE123');
 *
 * // Award points after payment
 * await pionts.orders.paid({ orderId: 'ORD-1', email: 'user@example.com', orderTotal: 99.99 });
 * ```
 */
export class PiontsClient {
  private readonly apiUrl: string;
  private readonly secretKey: string;
  private readonly timeout: number;

  /** Checkout discount code operations */
  readonly checkout: {
    validate: (code: string) => Promise<ValidateResult>;
    markUsed: (code: string, orderId?: string) => Promise<MarkUsedResult>;
  };

  /** Order lifecycle notifications */
  readonly orders: {
    paid: (data: OrderPaidData) => Promise<OrderPaidResult>;
    refunded: (orderId: string, amount?: number) => Promise<void>;
  };

  /** Customer data and redemption operations */
  readonly customers: {
    get: (email: string) => Promise<CustomerData>;
    redeem: (email: string, points: number) => Promise<RedeemResult>;
    cancelRedemption: (email: string, redemptionId: string) => Promise<CancelResult>;
  };

  /** Project configuration */
  readonly config: {
    get: () => Promise<ProjectConfig>;
  };

  /** Widget initialization */
  readonly widget: {
    init: (email: string, name?: string) => Promise<WidgetInitData>;
  };

  constructor(options: PiontsClientOptions) {
    // Normalize: strip trailing slash, ensure /api/v2 suffix
    let url = options.apiUrl.replace(/\/+$/, '');
    if (!url.endsWith('/api/v2')) {
      // If they passed the base URL without /api/v2, append it
      if (url.endsWith('/api/v1') || url.endsWith('/api')) {
        url = url.replace(/\/api(\/v\d+)?$/, '/api/v2');
      } else {
        url = `${url}/api/v2`;
      }
    }

    this.apiUrl = url;
    this.secretKey = options.secretKey;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;

    // Bind namespaced methods
    this.checkout = {
      validate: (code) => this.post<ValidateResult>('/checkout/validate', { code }),
      markUsed: (code, orderId) => this.post<MarkUsedResult>('/checkout/mark-used', { code, orderId }),
    };

    this.orders = {
      paid: (data) => this.post<OrderPaidResult>('/orders/paid', data),
      refunded: (orderId, amount) => this.post('/orders/refunded', { orderId, refundAmount: amount }),
    };

    this.customers = {
      get: (email) => this.get<CustomerData>(`/customers/${encodeURIComponent(email)}`),
      redeem: (email, points) => this.post<RedeemResult>(`/customers/${encodeURIComponent(email)}/redeem`, { points }),
      cancelRedemption: (email, id) => this.delete<CancelResult>(`/customers/${encodeURIComponent(email)}/redemptions/${id}`),
    };

    this.config = {
      get: () => this.get<ProjectConfig>('/config'),
    };

    this.widget = {
      init: (email, name) => this.post<WidgetInitData>('/widget/init', { email, name }),
    };
  }

  // ==================== HTTP Methods ====================

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // ==================== Core Request ====================

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retry = true,
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const headers: Record<string, string> = {
      'X-Api-Key': this.secretKey,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await this.fetchWithTimeout(url, options);
      return await this.handleResponse<T>(response);
    } catch (err) {
      // Retry once on 5xx or network errors
      if (retry && this.isRetryable(err)) {
        await this.delay(RETRY_DELAY);
        return this.request<T>(method, path, body, false);
      }
      throw err;
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new PiontsTimeoutError(this.timeout);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      const text = await response.text();
      if (!text) return {} as T;
      return JSON.parse(text) as T;
    }

    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }

    const message =
      (errorBody as any)?.message ??
      (errorBody as any)?.error ??
      `Pionts API error: ${response.status}`;

    throw new PiontsError(message, response.status, errorBody);
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof PiontsError) {
      return err.statusCode >= 500;
    }
    // Retry on network errors (not timeouts — those already waited)
    return !(err instanceof PiontsTimeoutError);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
