import React, { createContext, useContext, useMemo } from 'react';
import { createI18n, createCurrencyFormatter } from './engine';
import type { CurrencyConfig } from './engine';
import { getCurrencyConfig } from './currency';
import en from './locales/en';
import de from './locales/de';

const LOCALE_MAP: Record<string, Record<string, string>> = { en, de };

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string;
  tPlural: (key: string, count: number, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  locale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: string;
  currencyOverride?: Partial<CurrencyConfig>;
  children: React.ReactNode;
}

export function I18nProvider({ locale, currencyOverride, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    const messages = LOCALE_MAP[locale] ?? en;
    const { t, tPlural } = createI18n(messages, en);
    const currencyConfig = getCurrencyConfig(locale, currencyOverride);
    const formatCurrency = createCurrencyFormatter(currencyConfig);
    return { t, tPlural, formatCurrency, locale };
  }, [locale, currencyOverride]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
