export { I18nProvider, useI18n } from './I18nContext';
export { createI18n, createCurrencyFormatter } from './engine';
export type { CurrencyConfig } from './engine';
export { getCurrencyConfig, CURRENCY_DEFAULTS } from './currency';

export const SUPPORTED_LOCALES = ['en', 'de'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

interface LocaleConfig {
  locale?: string;
}

export function resolveLocale(config?: LocaleConfig): string {
  // 1. Explicit config
  if (config?.locale && SUPPORTED_LOCALES.includes(config.locale as SupportedLocale)) {
    return config.locale;
  }

  // 2. HTML lang attribute
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang?.split('-')[0];
    if (htmlLang && SUPPORTED_LOCALES.includes(htmlLang as SupportedLocale)) {
      return htmlLang;
    }
  }

  // 3. Navigator language
  if (typeof navigator !== 'undefined') {
    const navLang = navigator.language?.split('-')[0];
    if (navLang && SUPPORTED_LOCALES.includes(navLang as SupportedLocale)) {
      return navLang;
    }
  }

  // 4. Default
  return 'en';
}
