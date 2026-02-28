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
}

interface InternalConfig extends LoyaltyConfig {
  referralCode: string | null;
  containerEl: HTMLElement;
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function captureReferral(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    setCookie('pionts_ref', ref, 30);
    return ref;
  }
  return getCookie('pionts_ref');
}

let containerEl: HTMLElement | null = null;

const Loyalty = {
  init(config: LoyaltyConfig) {
    const referralCode = captureReferral();
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

    // Load widget CSS + UMD bundle
    const widgetBase = config.widgetUrl || config.apiBase || '';

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${widgetBase}/widget/pionts-widget.css`;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = `${widgetBase}/widget/pionts-widget.umd.js`;
    script.async = true;
    document.body.appendChild(script);
  },

  open() {
    window.dispatchEvent(new CustomEvent('pionts:open'));
  },

  close() {
    window.dispatchEvent(new CustomEvent('pionts:close'));
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
