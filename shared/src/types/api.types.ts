import type { CustomerData, Redemption, ReferralData } from './index';

// ─── Widget API (both standalone and SDK) ───
export interface WidgetApi {
  getCustomer: () => Promise<CustomerData>;
  redeem: (tier_points: number) => Promise<unknown>;
  award: (type: string) => Promise<unknown>;
  getMyReferrals: () => Promise<ReferralData>;
  getMyRedemptions: () => Promise<Redemption[]>;
  sendCode: (email: string) => Promise<unknown>;
  verifyCode: (email: string, code: string) => Promise<{ token?: string }>;
  getLeaderboard: () => Promise<any[]>;
}

// ─── SDK Config (passed to Loyalty.init) ───
export interface SdkConfig {
  projectKey: string;
  apiBase?: string;
  mode?: 'floating' | 'embedded';
  containerEl?: HTMLElement;
  customer?: {
    email: string;
    name?: string;
    hmac: string;
  };
}

// ─── Fetch hook result ───
export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
