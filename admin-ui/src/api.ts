let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  _retried?: boolean;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(path, { ...options, headers, credentials: 'include' });

  // On 401, try silent refresh once
  if (res.status === 401 && !options._retried) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(path, { ...options, headers, credentials: 'include', _retried: true } as RequestInit);
    }
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data as T;
}

// Mutex for silentRefresh to prevent concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) {
        accessToken = data.accessToken;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Auth API ───
export const authApi = {
  login: (email: string, password: string): Promise<any> =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: Record<string, unknown>): Promise<any> =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  refresh: (): Promise<boolean> => silentRefresh(),
  logout: (): Promise<any> =>
    request('/auth/logout', { method: 'POST' }),
  me: (): Promise<any> => request('/auth/me'),
};

// ─── Org API ───
export const orgApi = {
  getOrg: (): Promise<any> => request('/api/v1/orgs/me'),
  updateOrg: (data: Record<string, unknown>): Promise<any> =>
    request('/api/v1/orgs/me', { method: 'PUT', body: JSON.stringify(data) }),
  getMembers: (): Promise<any> => request('/api/v1/orgs/me/members'),
  addMember: (data: Record<string, unknown>): Promise<any> =>
    request('/api/v1/orgs/me/members', { method: 'POST', body: JSON.stringify(data) }),
  removeMember: (id: number | string): Promise<any> =>
    request(`/api/v1/orgs/me/members/${id}`, { method: 'DELETE' }),
  getCustomers: (params: Record<string, string | number>): Promise<any> =>
    request(`/api/v1/orgs/me/customers?${new URLSearchParams(params as Record<string, string>)}`),
};

// ─── Project API ───
export const projectApi = {
  list: (): Promise<any> => request('/api/v1/projects'),
  create: (data: Record<string, unknown>): Promise<any> =>
    request('/api/v1/projects', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number | string): Promise<any> => request(`/api/v1/projects/${id}`),
  update: (id: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archive: (id: number | string): Promise<any> =>
    request(`/api/v1/projects/${id}`, { method: 'DELETE' }),
  getKeys: (id: number | string): Promise<any> => request(`/api/v1/projects/${id}/keys`),
  generateKeys: (id: number | string): Promise<any> =>
    request(`/api/v1/projects/${id}/keys`, { method: 'POST' }),
  revokeKey: (id: number | string, keyId: number | string): Promise<any> =>
    request(`/api/v1/projects/${id}/keys/${keyId}`, { method: 'DELETE' }),
  getMembers: (id: number | string): Promise<any> =>
    request(`/api/v1/projects/${id}/members`),
  addMember: (id: number | string, userId: number, role: string): Promise<any> =>
    request(`/api/v1/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),
  updateMemberRole: (id: number | string, userId: number, role: string): Promise<any> =>
    request(`/api/v1/projects/${id}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  removeMember: (id: number | string, userId: number): Promise<any> =>
    request(`/api/v1/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  transferOwnership: (id: number | string, userId: number): Promise<any> =>
    request(`/api/v1/projects/${id}/transfer-ownership`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};

// ─── Dashboard API (project-scoped) ───
export const dashboardApi = {
  getStats: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/stats`),
  getCustomers: (pid: number | string, params: Record<string, string | number>): Promise<any> =>
    request(`/api/v1/projects/${pid}/customers?${new URLSearchParams(params as Record<string, string>)}`),
  getCustomer: (pid: number | string, custId: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/customers/${custId}`),
  awardPoints: (pid: number | string, custId: number | string, points: number, reason: string): Promise<any> =>
    request(`/api/v1/projects/${pid}/customers/${custId}/award`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    }),
  deductPoints: (pid: number | string, custId: number | string, points: number, reason: string): Promise<any> =>
    request(`/api/v1/projects/${pid}/customers/${custId}/deduct`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    }),
  getSettings: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/settings`),
  saveSettings: (pid: number | string, settings: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
  getReferrals: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/referrals`),
};

// ─── Earn Actions API (project-scoped) ───
export const earnActionsApi = {
  list: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/earn-actions`),
  create: (pid: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/earn-actions`, { method: 'POST', body: JSON.stringify(data) }),
  update: (pid: number | string, actionId: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/earn-actions/${actionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (pid: number | string, actionId: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/earn-actions/${actionId}`, { method: 'DELETE' }),
};

// ─── Redemption Tiers API (project-scoped) ───
export const redemptionTiersApi = {
  list: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/redemption-tiers`),
  create: (pid: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/redemption-tiers`, { method: 'POST', body: JSON.stringify(data) }),
  update: (pid: number | string, tierId: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/redemption-tiers/${tierId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (pid: number | string, tierId: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/redemption-tiers/${tierId}`, { method: 'DELETE' }),
};

// ─── Referral Levels API (project-scoped) ───
export const referralLevelsApi = {
  list: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/referral-levels`),
  create: (pid: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/referral-levels`, { method: 'POST', body: JSON.stringify(data) }),
  update: (pid: number | string, levelId: number | string, data: Record<string, unknown>): Promise<any> =>
    request(`/api/v1/projects/${pid}/referral-levels/${levelId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (pid: number | string, levelId: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/referral-levels/${levelId}`, { method: 'DELETE' }),
};

// ─── Partners API (project-scoped) ───
export const partnersApi = {
  list: (pid: number | string): Promise<any> => request(`/api/v1/projects/${pid}/partners`),
  promote: (pid: number | string, customerId: number, commissionPct: number): Promise<any> =>
    request(`/api/v1/projects/${pid}/partners`, {
      method: 'POST',
      body: JSON.stringify({ customerId, commissionPct }),
    }),
  updateCommission: (pid: number | string, partnerId: number | string, commissionPct: number): Promise<any> =>
    request(`/api/v1/projects/${pid}/partners/${partnerId}`, {
      method: 'PUT',
      body: JSON.stringify({ commissionPct }),
    }),
  demote: (pid: number | string, partnerId: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/partners/${partnerId}`, { method: 'DELETE' }),
  getEarnings: (pid: number | string, partnerId: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/partners/${partnerId}/earnings`),
};

// ─── Invitations API ───
export const invitationsApi = {
  list: (): Promise<any> => request('/api/v1/orgs/me/invitations'),
  create: (data: { email: string; role: string; projectId?: number }): Promise<any> =>
    request('/api/v1/orgs/me/invitations', { method: 'POST', body: JSON.stringify(data) }),
  revoke: (id: number): Promise<any> =>
    request(`/api/v1/orgs/me/invitations/${id}`, { method: 'DELETE' }),
  resend: (id: number): Promise<any> =>
    request(`/api/v1/orgs/me/invitations/${id}/resend`, { method: 'POST' }),
  getByToken: (token: string): Promise<any> =>
    fetch(`/api/v1/invitations/${token}`).then((r) => r.json()),
  accept: (token: string, data?: { password?: string; name?: string }): Promise<any> =>
    fetch(`/api/v1/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    }).then((r) => {
      if (!r.ok) return r.json().then((d) => { throw new Error(d.message || 'Request failed'); });
      return r.json();
    }),
};

// ─── Billing API ───
export const billingApi = {
  getSubscription: (): Promise<any> => request('/api/v1/billing/subscription'),
  checkout: (successUrl: string, cancelUrl: string): Promise<any> =>
    request('/api/v1/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ successUrl, cancelUrl }),
    }),
  portal: (returnUrl: string): Promise<any> =>
    request('/api/v1/billing/portal', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    }),
};

// ─── Analytics API (project-scoped) ───
export const analyticsApi = {
  getPointsEconomy: (pid: number | string, period = 'day', from?: string, to?: string): Promise<any> => {
    const params = new URLSearchParams({ period });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request(`/api/v1/projects/${pid}/analytics/points-economy?${params}`);
  },
  getReferralFunnel: (pid: number | string, from?: string, to?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request(`/api/v1/projects/${pid}/analytics/referral-funnel${qs ? '?' + qs : ''}`);
  },
  getSegments: (pid: number | string): Promise<any> =>
    request(`/api/v1/projects/${pid}/analytics/segments`),
  getSegmentCustomers: (pid: number | string, segment: string, limit = 50, offset = 0): Promise<any> =>
    request(`/api/v1/projects/${pid}/analytics/segments/${segment}/customers?limit=${limit}&offset=${offset}`),
  exportCustomersUrl: (pid: number | string): string =>
    `/api/v1/projects/${pid}/analytics/export/customers`,
  exportPointsLogUrl: (pid: number | string, from?: string, to?: string): string => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return `/api/v1/projects/${pid}/analytics/export/points-log${qs ? '?' + qs : ''}`;
  },
};

// ─── Legacy Admin API (backward compat) ───
const BASE = '/admin';
async function legacyRequest(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }
  return res.json();
}

export const adminApi = {
  checkSession: (): Promise<any> => legacyRequest('/api/session'),
  login: (password: string): Promise<any> =>
    legacyRequest('/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: (): Promise<any> => legacyRequest('/logout', { method: 'POST' }),
  getStats: (): Promise<any> => legacyRequest('/api/stats'),
  getCustomers: (params: Record<string, string>): Promise<any> => {
    const qs = new URLSearchParams(params).toString();
    return legacyRequest('/api/customers?' + qs);
  },
  getCustomer: (id: number | string): Promise<any> => legacyRequest('/api/customer/' + id),
  awardPoints: (id: number | string, points: number, reason: string): Promise<any> =>
    legacyRequest(`/api/customer/${id}/award`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    }),
  deductPoints: (id: number | string, points: number, reason: string): Promise<any> =>
    legacyRequest(`/api/customer/${id}/deduct`, {
      method: 'POST',
      body: JSON.stringify({ points, reason }),
    }),
  getSettings: (): Promise<any> => legacyRequest('/api/settings'),
  saveSettings: (settings: Record<string, unknown>): Promise<any> =>
    legacyRequest('/api/settings', { method: 'POST', body: JSON.stringify(settings) }),
  getReferrals: (): Promise<any> => legacyRequest('/api/referrals'),
};
