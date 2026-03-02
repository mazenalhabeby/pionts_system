import type { WidgetApi } from '@pionts/shared';

interface SdkApiConfig {
  apiBase: string;
  projectKey: string;
  getEmail: () => string | null;
  getHmac: () => string | null;
  getToken: () => string | null;
  getReferralCode: () => string | null;
  getName: () => string | null;
}

export interface SdkApi extends WidgetApi {
  signup: (email: string, name: string, referral_code?: string) => Promise<unknown>;
  checkRef: (code: string) => Promise<unknown>;
}

export function createSdkApi({ apiBase, projectKey, getEmail, getHmac, getToken, getReferralCode, getName }: SdkApiConfig): SdkApi {
  let referralCodeSent = false;

  async function request(path: string, options: RequestInit = {}): Promise<any> {
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

    // Send referral code on first customer request only, then clear the cookie
    if (!referralCodeSent) {
      const refCode = getReferralCode();
      if (refCode) {
        headers['X-Referral-Code'] = refCode;
        referralCodeSent = true;
        // Clear the pionts_ref cookie (root domain so it works across subdomains)
        const parts = window.location.hostname.split('.');
        const domain = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : window.location.hostname;
        document.cookie = `pionts_ref=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      }
    }

    const res = await fetch(`${apiBase}/api/v1/sdk${path}`, {
      headers,
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed (${res.status})`);
    }
    return res.json();
  }

  return {
    getCustomer: () => request('/customer'),

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
  };
}
