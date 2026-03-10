import type { CustomerData, Redemption, ReferralData } from './index';

// ─── Widget API (both standalone and SDK) ───
export interface WidgetApi {
  getCustomer: () => Promise<CustomerData>;
  redeem: (tier_points: number) => Promise<unknown>;
  award: (type: string) => Promise<unknown>;
  initiateSocialFollow: (type: string) => Promise<{ initiated: boolean; initiated_at: string }>;
  getMyReferrals: () => Promise<ReferralData>;
  getMyRedemptions: () => Promise<Redemption[]>;
  cancelRedemption: (id: number | string) => Promise<{ points_returned: number; new_balance: number }>;
  setBirthday: (birthday: string) => Promise<{ success: boolean; birthday: string }>;
  updateProfile: (data: { name?: string; birthday?: string }) => Promise<{ success: boolean }>;
  sendCode: (email: string) => Promise<unknown>;
  verifyCode: (email: string, code: string) => Promise<{ token?: string; accessToken?: string; refreshToken?: string }>;
  getLeaderboard: () => Promise<any[]>;
  applyPartner: (data: PartnerApplyData) => Promise<{ success: boolean; status: string; reason?: string }>;
}

// ─── Partner Application Data ───
export interface PartnerApplyData {
  dateOfBirth: string; // YYYY-MM-DD
  socialMedia: { platform: string; url: string; followers?: string }[];
  address: string;
  city: string;
  postalCode: string;
  country: string;
  iban: string;
}

// ─── SDK Config (passed to Loyalty.init) ───
export interface SdkConfig {
  projectKey: string;
  apiBase?: string;
  mode?: 'floating' | 'embedded';
  containerEl?: HTMLElement;
  referralCode?: string | null;
  locale?: string;
  currency?: {
    symbol?: string;
    position?: 'prefix' | 'suffix';
    decimals?: number;
    separator?: string;
  };
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
