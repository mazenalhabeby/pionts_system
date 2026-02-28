import type { WidgetApi } from '@pionts/shared';

const API_BASE = '';

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export interface StandaloneApi extends WidgetApi {
  checkAuth: () => Promise<unknown>;
  logout: () => Promise<unknown>;
}

export const api: StandaloneApi = {
  sendCode: (email) =>
    request('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyCode: (email, code) =>
    request('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  checkAuth: () => request('/api/auth/me'),

  logout: () =>
    request('/api/auth/logout', { method: 'POST' }),

  getCustomer: () => request('/api/customer/me'),

  redeem: (tier_points) =>
    request('/api/redeem', {
      method: 'POST',
      body: JSON.stringify({ tier_points }),
    }),

  award: (type) =>
    request('/api/award', {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  getMyReferrals: () => request('/api/customer/referrals'),

  getMyRedemptions: () => request('/api/customer/redemptions'),

  getLeaderboard: () => request('/api/leaderboard'),
};
