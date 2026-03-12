import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createSdkApi } from '../api-sdk';
import type { SdkConfig, CustomerData, WidgetApi } from '@pionts/shared';
import type { SdkApi } from '../api-sdk';

export interface PreAuthConfig {
  settings?: Record<string, string>;
  earn_actions?: { slug: string; label: string; points: number; points_mode?: string; category: string; frequency: string }[];
  redemption_tiers?: { points: number; discount: number }[];
  referral_levels?: { level: number; points: number }[];
  enabled_modules?: { points: boolean; referrals: boolean; partners: boolean };
}

interface WidgetContextValue {
  config: SdkConfig;
  customer: CustomerData | null;
  settings: Record<string, string> | null;
  loading: boolean;
  authenticated: boolean | null;
  api: SdkApi;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
  preAuthConfig: PreAuthConfig | null;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

function getStorageKey(projectKey: string): string {
  // Use first 12 chars of project key as prefix to scope per-project
  return `pionts_rt_${projectKey.substring(0, 12)}`;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (e.g. Safari private mode)
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
  }
}

const REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

export function WidgetProvider({ config, children }: { config: SdkConfig; children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const [preAuthConfig, setPreAuthConfig] = useState<PreAuthConfig | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const storageKey = getStorageKey(config.projectKey);
  const hasHmac = !!(config.customer?.email && config.customer?.hmac);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    tokenRef.current = null;
    refreshTokenRef.current = null;
    setToken(null);
    setCustomer(null);
    setSettings(null);
    setAuthenticated(false);
    removeStorage(storageKey);
    clearRefreshTimer();
  }, [storageKey, clearRefreshTimer]);

  const api = useRef(
    createSdkApi({
      apiBase: config.apiBase || '',
      projectKey: config.projectKey,
      getEmail: () => config.customer?.email || null,
      getHmac: () => config.customer?.hmac || null,
      getToken: () => tokenRef.current,
      getReferralCode: () => config.referralCode || null,
      getName: () => config.customer?.name || null,
      getRefreshToken: () => refreshTokenRef.current,
      onTokenRefreshed: (accessToken: string, refreshToken: string) => {
        tokenRef.current = accessToken;
        refreshTokenRef.current = refreshToken;
        writeStorage(getStorageKey(config.projectKey), refreshToken);
      },
      onAuthExpired: () => {
        handleLogout();
      },
    }),
  ).current;

  useEffect(() => {
    api.getConfig()
      .then((data) => {
        setPreAuthConfig(data);
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => { /* config fetch is optional */ });
  }, [api]);

  const fetchCustomer = useCallback(async () => {
    try {
      const data = await api.getCustomer();
      setCustomer(data);
      setSettings(data.settings || null);
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Start proactive refresh timer when authenticated via token (not HMAC)
  const startRefreshTimer = useCallback(() => {
    clearRefreshTimer();
    if (hasHmac) return; // HMAC sessions don't need token refresh
    refreshTimerRef.current = setInterval(() => {
      api.refreshAuth();
    }, REFRESH_INTERVAL_MS);
  }, [api, hasHmac, clearRefreshTimer]);

  // Attempt session restore from localStorage on mount
  useEffect(() => {
    if (hasHmac) {
      fetchCustomer();
      return;
    }

    const savedRt = readStorage(storageKey);
    if (savedRt) {
      refreshTokenRef.current = savedRt;
      api.refreshAuth().then((ok) => {
        if (ok) {
          fetchCustomer().then(() => startRefreshTimer());
        } else {
          // Refresh token invalid/expired — clean up
          removeStorage(storageKey);
          refreshTokenRef.current = null;
          setLoading(false);
          setAuthenticated(false);
        }
      });
    } else {
      setLoading(false);
      setAuthenticated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When token changes from login (not from mount restore)
  useEffect(() => {
    if (token && !hasHmac) {
      fetchCustomer().then(() => startRefreshTimer());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Cleanup timer on unmount
  useEffect(() => clearRefreshTimer, [clearRefreshTimer]);

  const login = useCallback(async (email: string, code: string) => {
    const result = await api.verifyCode(email, code);

    // Use new token pair if available, fall back to legacy token
    if (result.accessToken && result.refreshToken) {
      tokenRef.current = result.accessToken;
      refreshTokenRef.current = result.refreshToken;
      writeStorage(storageKey, result.refreshToken);
      setToken(result.accessToken);
    } else {
      tokenRef.current = result.token || null;
      setToken(result.token || null);
    }
  }, [api, storageKey]);

  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const refresh = useCallback(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return (
    <WidgetContext.Provider
      value={{ config, customer, settings, loading, authenticated, api, login, logout, refresh, preAuthConfig }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidget(): WidgetContextValue {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error('useWidget must be used within WidgetProvider');
  return ctx;
}
