import React, { createContext, useContext, useMemo } from 'react';
import { useWidget } from './WidgetContext';
import type { PreAuthConfig } from './WidgetContext';
import type { WidgetApi, CustomerData, ProjectSettings, SdkConfig, ReferralLevelConfig } from '@pionts/shared';
import { useI18n } from '../i18n';

/**
 * Build level_labels and level_earn arrays from dynamic referral_levels config.
 * Falls back to provided defaults when referral_levels is empty or undefined.
 */
function buildReferralLevelSettings(
  referralLevels: ReferralLevelConfig[] | undefined,
  fallbackLabels: string[],
  fallbackEarn: string[],
  t: (key: string, params?: Record<string, string | number>) => string,
): { levelLabels: string[]; levelEarn: string[] } {
  if (!referralLevels || referralLevels.length === 0) {
    return { levelLabels: fallbackLabels, levelEarn: fallbackEarn };
  }

  const maxLevel = Math.max(...referralLevels.map((l) => l.level), 1);
  const levelLabels: string[] = [];
  const levelEarn: string[] = [];

  for (let i = 1; i <= maxLevel; i++) {
    levelLabels.push(t('config.level', { n: i }));
    const rl = referralLevels.find((l) => l.level === i);
    levelEarn.push(rl && rl.points > 0 ? t('config.earns', { pts: rl.points }) : '');
  }

  return { levelLabels, levelEarn };
}

interface WidgetConfigContextValue {
  authenticated: boolean | null;
  loading?: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  settings: ProjectSettings | null;
  api: WidgetApi;
  customer?: CustomerData | null;
  refresh: () => void;
  config?: SdkConfig;
  preAuthConfig?: PreAuthConfig | null;
}

const WidgetConfigContext = createContext<WidgetConfigContextValue | null>(null);

/**
 * WidgetConfigProvider -- wraps the SDK/UMD mode with WidgetContext.
 */
export function WidgetConfigProvider({ children }: { children: React.ReactNode }) {
  const { config, customer, settings: rawSettings, loading, authenticated, api, login, logout, refresh, preAuthConfig } = useWidget();
  const { t } = useI18n();

  const settings = useMemo<ProjectSettings | null>(() => {
    if (!rawSettings) return null;

    // Build fallback from legacy settings
    const l2Pts = rawSettings.referral_l2_points || '5';
    const l3Pts = rawSettings.referral_l3_points || '2';
    const fallbackLabels = [t('config.level', { n: 1 }), t('config.level', { n: 2 }), t('config.level', { n: 3 })];
    const fallbackEarn = [t('config.earns', { pts: l2Pts }), t('config.earns', { pts: l3Pts }), ''];

    // Use dynamic referral_levels from customer data when available
    const { levelLabels, levelEarn } = buildReferralLevelSettings(
      customer?.referral_levels,
      fallbackLabels,
      fallbackEarn,
      t,
    );

    return {
      ...rawSettings,
      level_labels: levelLabels,
      level_earn: levelEarn,
    };
  }, [rawSettings, customer?.referral_levels, t]);

  const value = useMemo<WidgetConfigContextValue>(() => ({
    authenticated,
    loading,
    login,
    logout,
    settings,
    api,
    customer,
    refresh,
    config,
    preAuthConfig,
  }), [authenticated, loading, login, logout, settings, api, customer, refresh, config, preAuthConfig]);

  return (
    <WidgetConfigContext.Provider value={value}>
      {children}
    </WidgetConfigContext.Provider>
  );
}

export function useWidgetConfig(): WidgetConfigContextValue {
  const ctx = useContext(WidgetConfigContext);
  if (!ctx) throw new Error('useWidgetConfig must be used within a WidgetConfigProvider');
  return ctx;
}
