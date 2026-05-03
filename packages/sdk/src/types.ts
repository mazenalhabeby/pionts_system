// ==================== Client Options ====================

export interface PiontsClientOptions {
  /** Pionts API base URL (e.g. https://pionts.example.com/api/v2) */
  apiUrl: string;
  /** Secret API key (sk_live_...) */
  secretKey: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

// ==================== Checkout ====================

export interface ValidateResult {
  valid: boolean;
  discountAmount?: number;
  alreadyUsed?: boolean;
}

export interface MarkUsedResult {
  success: boolean;
}

// ==================== Orders ====================

export interface OrderPaidData {
  orderId: string;
  email: string;
  customerName?: string;
  orderTotal: number;
  currency?: string;
  referralCode?: string;
}

export interface OrderPaidResult {
  status: string;
  points_awarded?: number;
}

// ==================== Customers ====================

export interface CustomerData {
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

export interface PointsLogEntry {
  id: number;
  type: string;
  points: number;
  description: string;
  created_at: string;
}

export interface RedemptionEntry {
  id: number;
  points_spent: number;
  discount_amount: number;
  discount_code: string;
  used: boolean;
  created_at: string;
}

export interface RedeemResult {
  discount_code: string;
  discount_amount: number;
  new_balance: number;
  platform_created: boolean;
}

export interface CancelResult {
  points_returned: number;
  new_balance: number;
}

// ==================== Config ====================

export interface ProjectConfig {
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

export interface EarnAction {
  id: number;
  slug: string;
  label: string;
  points: number;
  category: string;
  frequency: string;
  [key: string]: unknown;
}

export interface RedemptionTier {
  id: number;
  points: number;
  discount: number;
}

export interface ReferralLevel {
  level: number;
  points: number;
}

// ==================== Widget ====================

export interface WidgetInitData {
  projectKey: string;
  hmac: string;
  apiBase: string;
  email: string;
  name?: string;
}
