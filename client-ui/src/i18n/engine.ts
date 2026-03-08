export type TranslationMap = Record<string, string>;

export interface I18nEngine {
  t: (key: string, params?: Record<string, string | number>) => string;
  tPlural: (key: string, count: number, params?: Record<string, string | number>) => string;
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = params[k];
    return v != null ? String(v) : `{{${k}}}`;
  });
}

export function createI18n(
  messages: TranslationMap,
  fallback: TranslationMap,
): I18nEngine {
  function resolve(key: string): string {
    return messages[key] ?? fallback[key] ?? key;
  }

  function t(key: string, params?: Record<string, string | number>): string {
    return interpolate(resolve(key), params);
  }

  function tPlural(key: string, count: number, params?: Record<string, string | number>): string {
    const suffix = count === 1 ? '_one' : '_other';
    const resolved = messages[key + suffix] ?? fallback[key + suffix] ?? resolve(key);
    return interpolate(resolved, { count, ...params });
  }

  return { t, tPlural };
}

export interface CurrencyConfig {
  symbol: string;
  position: 'prefix' | 'suffix';
  decimals: number;
  separator: string;
}

export function createCurrencyFormatter(config: CurrencyConfig): (amount: number) => string {
  return (amount: number) => {
    const num = typeof amount === 'number' ? amount : Number(amount) || 0;
    const parts = num.toFixed(config.decimals).split('.');
    const formatted = config.separator === ',' && parts.length === 2
      ? `${parts[0]},${parts[1]}`
      : parts.join('.');
    // Strip trailing zeros for whole numbers (e.g. "5.00" -> "5" when decimals=0 or amount is integer)
    const clean = Number.isInteger(num) && config.decimals > 0
      ? String(num)
      : formatted;
    return config.position === 'prefix'
      ? `${config.symbol}${clean}`
      : `${clean}${config.symbol}`;
  };
}
