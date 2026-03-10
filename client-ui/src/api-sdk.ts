import type { WidgetApi, PartnerApplyData } from '@pionts/shared';

interface SdkApiConfig {
  apiBase: string;
  projectKey: string;
  getEmail: () => string | null;
  getHmac: () => string | null;
  getToken: () => string | null;
  getReferralCode: () => string | null;
  getName: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefreshed?: (accessToken: string, refreshToken: string) => void;
  onAuthExpired?: () => void;
}

export interface SdkApi extends WidgetApi {
  signup: (email: string, name: string, referral_code?: string) => Promise<unknown>;
  checkRef: (code: string) => Promise<unknown>;
  getConfig: () => Promise<any>;
  refreshAuth: () => Promise<boolean>;
}

export function createSdkApi({ apiBase, projectKey, getEmail, getHmac, getToken, getReferralCode, getName, getRefreshToken, onTokenRefreshed, onAuthExpired }: SdkApiConfig): SdkApi {

  // Dedup concurrent refresh attempts
  let refreshPromise: Promise<boolean> | null = null;

  async function refreshAuth(): Promise<boolean> {
    const rt = getRefreshToken?.();
    if (!rt) return false;

    try {
      const res = await fetch(`${apiBase}/api/v1/sdk/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-Key': projectKey,
        },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken && data.refreshToken) {
        onTokenRefreshed?.(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function deduplicatedRefresh(): Promise<boolean> {
    if (!refreshPromise) {
      refreshPromise = refreshAuth().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }

  async function publicRequest(path: string): Promise<any> {
    const res = await fetch(`${apiBase}/api/v1/sdk${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Key': projectKey,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed (${res.status})`);
    }
    return res.json();
  }

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Project-Key': projectKey,
    };

    const email = getEmail();
    const hmac = getHmac();
    const token = getToken();

    if (email && hmac) {
      headers['X-Customer-Email'] = email;
      headers['X-Customer-Hmac'] = hmac;
      const name = getName();
      if (name) headers['X-Customer-Name'] = name;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const refCode = getReferralCode();
    if (refCode) {
      headers['X-Referral-Code'] = refCode;
    }

    return headers;
  }

  async function request(path: string, options: RequestInit = {}): Promise<any> {
    const headers = buildHeaders();

    const res = await fetch(`${apiBase}/api/v1/sdk${path}`, {
      headers,
      ...options,
    });

    // On 401, try silent refresh then retry once
    if (res.status === 401 && getRefreshToken?.()) {
      const refreshed = await deduplicatedRefresh();
      if (refreshed) {
        const retryHeaders = buildHeaders();
        const retryRes = await fetch(`${apiBase}/api/v1/sdk${path}`, {
          headers: retryHeaders,
          ...options,
        });
        if (!retryRes.ok) {
          if (retryRes.status === 401) {
            onAuthExpired?.();
          }
          const body = await retryRes.json().catch(() => ({}));
          throw new Error(body.message || `Request failed (${retryRes.status})`);
        }
        return retryRes.json();
      }
      // Refresh failed — force logout
      onAuthExpired?.();
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed (${res.status})`);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed (${res.status})`);
    }
    return res.json();
  }

  return {
    getCustomer: async () => {
      const data = await request('/customer');
      // Clear referral cookie once customer is loaded (referral has been processed)
      if (data && getReferralCode()) {
        const parts = window.location.hostname.split('.');
        const domain = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : window.location.hostname;
        document.cookie = `pionts_ref=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      }
      return data;
    },

    signup: (email, name, referral_code) =>
      request('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, name, referral_code }),
      }),

    redeem: (tier_points) =>
      request('/redeem', {
        method: 'POST',
        body: JSON.stringify({ tier_points }),
      }),

    award: (type) =>
      request('/award', {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),

    initiateSocialFollow: (type) =>
      request('/social/initiate', {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),

    checkRef: (code) => request(`/check-ref/${code}`),

    getMyReferrals: () => request('/customer/referrals'),

    getMyRedemptions: () => request('/customer/redemptions'),

    cancelRedemption: (id: number | string) =>
      request(`/customer/redemptions/${id}`, { method: 'DELETE' }),

    setBirthday: (birthday: string) =>
      request('/customer/birthday', {
        method: 'PUT',
        body: JSON.stringify({ birthday }),
      }),

    updateProfile: (data: { name?: string; birthday?: string }) =>
      request('/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    sendCode: (email) =>
      request('/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verifyCode: (email, code) =>
      request('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    getLeaderboard: () => request('/leaderboard'),

    applyPartner: (data: PartnerApplyData) =>
      request('/partner/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getConfig: () => publicRequest('/config'),

    refreshAuth: deduplicatedRefresh,
  };
}
