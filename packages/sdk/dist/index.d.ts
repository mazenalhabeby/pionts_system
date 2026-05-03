interface PiontsClientOptions {
    /** Pionts API base URL (e.g. https://pionts.example.com/api/v2) */
    apiUrl: string;
    /** Secret API key (sk_live_...) */
    secretKey: string;
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number;
}
interface ValidateResult {
    valid: boolean;
    discountAmount?: number;
    alreadyUsed?: boolean;
}
interface MarkUsedResult {
    success: boolean;
}
interface OrderPaidData {
    orderId: string;
    email: string;
    customerName?: string;
    orderTotal: number;
    currency?: string;
    referralCode?: string;
}
interface OrderPaidResult {
    status: string;
    points_awarded?: number;
}
interface CustomerData {
    found: boolean;
    points_balance?: number;
    points_earned_total?: number;
    referral_code?: string;
    birthday?: string | null;
    history?: PointsLogEntry[];
    historyTotal?: number;
    redemptions?: RedemptionEntry[];
    [key: string]: unknown;
}
interface PointsLogEntry {
    id: number;
    type: string;
    points: number;
    description: string;
    created_at: string;
}
interface RedemptionEntry {
    id: number;
    points_spent: number;
    discount_amount: number;
    discount_code: string;
    used: boolean;
    created_at: string;
}
interface RedeemResult {
    discount_code: string;
    discount_amount: number;
    new_balance: number;
    platform_created: boolean;
}
interface CancelResult {
    points_returned: number;
    new_balance: number;
}
interface ProjectConfig {
    project: {
        name: string;
        platform: string;
        [key: string]: unknown;
    };
    settings: Record<string, string>;
    earn_actions: EarnAction[];
    redemption_tiers: RedemptionTier[];
    referral_levels: ReferralLevel[];
}
interface EarnAction {
    id: number;
    slug: string;
    label: string;
    points: number;
    category: string;
    frequency: string;
    [key: string]: unknown;
}
interface RedemptionTier {
    id: number;
    points: number;
    discount: number;
}
interface ReferralLevel {
    level: number;
    points: number;
}
interface WidgetInitData {
    projectKey: string;
    hmac: string;
    apiBase: string;
    email: string;
    name?: string;
}

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
declare class PiontsClient {
    private readonly apiUrl;
    private readonly secretKey;
    private readonly timeout;
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
    constructor(options: PiontsClientOptions);
    private get;
    private post;
    private delete;
    private request;
    private fetchWithTimeout;
    private handleResponse;
    private isRetryable;
    private delay;
}

/**
 * Utility for verifying Pionts webhook signatures.
 *
 * @example
 * ```typescript
 * const isValid = PiontsWebhook.verify(rawBody, signature, webhookSecret);
 * if (!isValid) throw new Error('Invalid webhook signature');
 * ```
 */
declare class PiontsWebhook {
    /**
     * Verify a webhook signature using HMAC-SHA256.
     *
     * @param rawBody - The raw request body as string or Buffer
     * @param signature - The signature from the `X-Pionts-Signature` header (format: `sha256=<hex>`)
     * @param secret - The webhook secret for this endpoint
     * @returns true if the signature is valid
     */
    static verify(rawBody: string | Buffer, signature: string, secret: string): boolean;
}

/**
 * Base error class for Pionts SDK errors.
 */
declare class PiontsError extends Error {
    readonly statusCode: number;
    readonly response?: unknown | undefined;
    constructor(message: string, statusCode: number, response?: unknown | undefined);
}
/**
 * Thrown when a request times out.
 */
declare class PiontsTimeoutError extends PiontsError {
    constructor(timeoutMs: number);
}

export { type CancelResult, type CustomerData, type EarnAction, type MarkUsedResult, type OrderPaidData, type OrderPaidResult, PiontsClient, type PiontsClientOptions, PiontsError, PiontsTimeoutError, PiontsWebhook, type PointsLogEntry, type ProjectConfig, type RedeemResult, type RedemptionEntry, type RedemptionTier, type ReferralLevel, type ValidateResult, type WidgetInitData };
