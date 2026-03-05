import { describe, it, expect, vi, afterEach } from 'vitest';
import { createI18n, createCurrencyFormatter } from '../i18n/engine';
import { resolveLocale, SUPPORTED_LOCALES } from '../i18n';
import { getCurrencyConfig } from '../i18n/currency';

describe('createI18n', () => {
  const messages = { 'hello': 'Hello {{name}}', 'count_one': '{{count}} item', 'count_other': '{{count}} items' };
  const fallback = { 'hello': 'Hi {{name}}', 'missing_in_primary': 'From fallback' };

  it('resolves keys from primary messages', () => {
    const { t } = createI18n(messages, fallback);
    expect(t('hello', { name: 'World' })).toBe('Hello World');
  });

  it('falls back to fallback messages', () => {
    const { t } = createI18n(messages, fallback);
    expect(t('missing_in_primary')).toBe('From fallback');
  });

  it('returns key when not found in either', () => {
    const { t } = createI18n(messages, fallback);
    expect(t('totally.missing')).toBe('totally.missing');
  });

  it('interpolates multiple params', () => {
    const msgs = { 'msg': '{{a}} and {{b}}' };
    const { t } = createI18n(msgs, {});
    expect(t('msg', { a: 'X', b: 'Y' })).toBe('X and Y');
  });

  it('leaves unmatched placeholders', () => {
    const msgs = { 'msg': 'Hello {{name}}' };
    const { t } = createI18n(msgs, {});
    expect(t('msg')).toBe('Hello {{name}}');
  });

  it('pluralizes with _one/_other suffixes', () => {
    const { tPlural } = createI18n(messages, fallback);
    expect(tPlural('count', 1)).toBe('1 item');
    expect(tPlural('count', 5)).toBe('5 items');
  });

  it('falls back to base key when plural form not found', () => {
    const msgs = { 'simple': 'Just a string' };
    const { tPlural } = createI18n(msgs, {});
    expect(tPlural('simple', 3)).toBe('Just a string');
  });
});

describe('createCurrencyFormatter', () => {
  it('formats with prefix position', () => {
    const fmt = createCurrencyFormatter({ symbol: '$', position: 'prefix', decimals: 2, separator: '.' });
    expect(fmt(5)).toBe('$5');
    expect(fmt(9.99)).toBe('$9.99');
  });

  it('formats with suffix position', () => {
    const fmt = createCurrencyFormatter({ symbol: '\u20AC', position: 'suffix', decimals: 2, separator: ',' });
    expect(fmt(10)).toBe('10\u20AC');
    expect(fmt(10.5)).toBe('10,50\u20AC');
  });

  it('respects decimals=0', () => {
    const fmt = createCurrencyFormatter({ symbol: '$', position: 'prefix', decimals: 0, separator: '.' });
    expect(fmt(5)).toBe('$5');
  });
});

describe('getCurrencyConfig', () => {
  it('returns defaults for known locales', () => {
    const en = getCurrencyConfig('en');
    expect(en.position).toBe('prefix');
    const de = getCurrencyConfig('de');
    expect(de.position).toBe('suffix');
  });

  it('falls back to en for unknown locale', () => {
    const cfg = getCurrencyConfig('xx');
    expect(cfg.symbol).toBe('\u20AC');
    expect(cfg.position).toBe('prefix');
  });

  it('applies overrides', () => {
    const cfg = getCurrencyConfig('en', { symbol: '$', position: 'prefix' });
    expect(cfg.symbol).toBe('$');
    expect(cfg.position).toBe('prefix');
  });
});

describe('resolveLocale', () => {
  const originalLang = document.documentElement.lang;
  const originalNavigator = navigator.language;

  afterEach(() => {
    document.documentElement.lang = originalLang;
    Object.defineProperty(navigator, 'language', { value: originalNavigator, writable: true });
  });

  it('uses explicit config.locale', () => {
    expect(resolveLocale({ locale: 'de' })).toBe('de');
  });

  it('ignores unsupported explicit locale', () => {
    document.documentElement.lang = '';
    Object.defineProperty(navigator, 'language', { value: 'en-US', writable: true });
    expect(resolveLocale({ locale: 'xx' })).toBe('en');
  });

  it('reads from document.documentElement.lang', () => {
    document.documentElement.lang = 'de';
    expect(resolveLocale()).toBe('de');
    document.documentElement.lang = originalLang;
  });

  it('reads from navigator.language', () => {
    document.documentElement.lang = '';
    Object.defineProperty(navigator, 'language', { value: 'de-DE', writable: true });
    expect(resolveLocale()).toBe('de');
  });

  it('defaults to en', () => {
    document.documentElement.lang = '';
    Object.defineProperty(navigator, 'language', { value: 'xx', writable: true });
    expect(resolveLocale()).toBe('en');
  });
});

describe('SUPPORTED_LOCALES', () => {
  it('includes en and de', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('de');
  });
});
