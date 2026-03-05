import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createSdkApi } from '../api-sdk';
import type { SdkConfig, CustomerData, ProjectSettings, WidgetApi } from '@pionts/shared';
import type { SdkApi } from '../api-sdk';

export interface PreAuthConfig {
  settings?: Record<string, string>;
  earn_actions?: { slug: string; label: string; points: number; category: string; frequency: string }[];
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

export function WidgetProvider({ config, children }: { config: SdkConfig; children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [preAuthConfig, setPreAuthConfig] = useState<PreAuthConfig | null>(null);

  const hasHmac = !!(config.customer?.email && config.customer?.hmac);

  const api = useRef(
    createSdkApi({
      apiBase: config.apiBase || '',
      projectKey: config.projectKey,
      getEmail: () => config.customer?.email || null,
      getHmac: () => config.customer?.hmac || null,
      getToken: () => tokenRef.current,
      getReferralCode: () => config.referralCode || null,
      getName: () => config.customer?.name || null,
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

  useEffect(() => {
    if (hasHmac) {
      fetchCustomer();
    } else if (token) {
      fetchCustomer();
    } else {
      setLoading(false);
      setAuthenticated(false);
    }
  }, [hasHmac, token, fetchCustomer]);

  const login = useCallback(async (email: string, code: string) => {
    const result = await api.verifyCode(email, code);
    tokenRef.current = result.token || null;
    setToken(result.token || null);
  }, [api]);

  const logout = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    setCustomer(null);
    setSettings(null);
    setAuthenticated(false);
  }, []);

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
