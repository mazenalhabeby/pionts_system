interface LoyaltyCustomer {
  email: string;
  name?: string;
  hmac?: string;
}

interface LoyaltyConfig {
  projectKey: string;
  customer?: LoyaltyCustomer;
  mode?: 'floating' | 'embedded';
  container?: string;
  apiBase?: string;
  widgetUrl?: string;
  locale?: string;
  currency?: {
    symbol?: string;
    position?: 'prefix' | 'suffix';
    decimals?: number;
    separator?: string;
  };
}

interface InternalConfig extends LoyaltyConfig {
  referralCode: string | null;
  containerEl: HTMLElement;
}

const REF_KEY = 'pionts_ref';

// Get root domain (e.g. "8bc.store" from "account.8bc.store")
// so the cookie is shared across all subdomains
function getRootDomain(): string {
  const parts = window.location.hostname.split('.');
  // For domains like "8bc.store" (2 parts) or "account.8bc.store" (3 parts)
  // return ".8bc.store" to cover all subdomains
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return window.location.hostname;
}

function setCookie(name: string, value: string, days: number): void {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const domain = getRootDomain();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;domain=${domain};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string): void {
  const domain = getRootDomain();
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
}

function captureReferral(): void {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    setCookie(REF_KEY, ref, 30);
  }
}

function getReferralCode(): string | null {
  return getCookie(REF_KEY);
}

function clearReferralCode(): void {
  deleteCookie(REF_KEY);
}

// Capture referral code immediately on script load
// so it's saved even on pages where init() isn't called (e.g. landing page before login)
captureReferral();

let containerEl: HTMLElement | null = null;

const Loyalty = {
  init(config: LoyaltyConfig) {
    const referralCode = getReferralCode();
    const mode = config.mode || 'floating';

    // Create or find container
    let el: HTMLElement;
    if (mode === 'embedded' && config.container) {
      const existing = document.querySelector(config.container) as HTMLElement;
      if (!existing) {
        console.error('[Pionts] Container not found:', config.container);
        return;
      }
      el = existing;
    } else {
      el = document.createElement('div');
      el.id = 'pionts-widget-root';
      document.body.appendChild(el);
    }
    containerEl = el;

    // Set global config for the widget UMD bundle to read
    const internalConfig: InternalConfig = {
      ...config,
      referralCode,
      containerEl: el,
    };
    (window as any).__PIONTS_CONFIG__ = internalConfig;

    // Load widget CSS + UMD bundle (cache-bust with version)
    const widgetBase = config.widgetUrl || config.apiBase || '';
    const v = 'v=3';

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${widgetBase}/widget/pionts-widget.css?${v}`;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = `${widgetBase}/widget/pionts-widget.umd.js?${v}`;
    script.async = true;
    document.body.appendChild(script);
  },

  open() {
    window.dispatchEvent(new CustomEvent('pionts:open'));
  },

  close() {
    window.dispatchEvent(new CustomEvent('pionts:close'));
  },

  clearReferral() {
    clearReferralCode();
  },

  destroy() {
    window.dispatchEvent(new CustomEvent('pionts:destroy'));
    if (containerEl && containerEl.id === 'pionts-widget-root') {
      containerEl.remove();
    }
    containerEl = null;
    delete (window as any).__PIONTS_CONFIG__;
  },
};

// Attach to window
(window as any).Loyalty = Loyalty;

export default Loyalty;
