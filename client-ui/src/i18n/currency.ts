import type { CurrencyConfig } from './engine';

export const CURRENCY_DEFAULTS: Record<string, CurrencyConfig> = {
  en: { symbol: '\u20AC', position: 'prefix', decimals: 2, separator: '.' },
  de: { symbol: '\u20AC', position: 'suffix', decimals: 2, separator: ',' },
};

export function getCurrencyConfig(
  locale: string,
  override?: Partial<CurrencyConfig>,
): CurrencyConfig {
  const base = CURRENCY_DEFAULTS[locale] ?? CURRENCY_DEFAULTS.en;
  if (!override) return base;
  return { ...base, ...override };
}
