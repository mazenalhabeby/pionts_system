import React from 'react';
import ReactDOM from 'react-dom/client';
import { WidgetProvider } from './context/WidgetContext';
import { WidgetConfigProvider } from './context/WidgetConfigContext';
import { I18nProvider } from './i18n/I18nContext';
import { resolveLocale } from './i18n';
import ChatBubble from './components/ChatBubble';
import WidgetApp from './WidgetApp';
import type { SdkConfig } from '@pionts/shared';
import type { CurrencyConfig } from './i18n';

// Import CSS as string for Shadow DOM injection
import widgetCssUrl from './styles/widget.css?inline';

/**
 * <pionts-widget> — Self-contained Web Component for the Pionts loyalty widget.
 *
 * Usage:
 *   <pionts-widget
 *     project-key="pk_live_..."
 *     customer-email="user@example.com"
 *     customer-hmac="abc123..."
 *     customer-name="John"
 *     mode="floating"
 *     api-base="https://pionts.example.com"
 *     locale="en"
 *     currency-symbol="$"
 *     currency-position="prefix"
 *   ></pionts-widget>
 *
 * Events:
 *   pionts:redeem   — detail: { code, amount, points }
 *   pionts:cancel   — detail: { redemptionId, pointsReturned }
 *   pionts:error    — detail: { message }
 */
class PiontsWidgetElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;
  private shadow: ShadowRoot;

  static get observedAttributes() {
    return [
      'project-key',
      'customer-email',
      'customer-hmac',
      'customer-name',
      'mode',
      'api-base',
      'locale',
      'currency-symbol',
      'currency-position',
      'currency-decimals',
    ];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  attributeChangedCallback() {
    // Re-render on attribute changes (debounced by browser)
    if (this.isConnected) {
      this.render();
    }
  }

  private render() {
    const config = this.buildConfig();
    if (!config.projectKey) return;

    // Inject styles into Shadow DOM
    if (!this.shadow.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = widgetCssUrl + this.getThemeCSS();
      this.shadow.appendChild(style);
    }

    // Create or reuse mount point
    let mountEl = this.shadow.getElementById('pionts-root');
    if (!mountEl) {
      mountEl = document.createElement('div');
      mountEl.id = 'pionts-root';
      this.shadow.appendChild(mountEl);
    }

    // Set containerEl for the widget internals
    config.containerEl = mountEl;

    const locale = resolveLocale(config);
    const currencyOverride = config.currency as Partial<CurrencyConfig> | undefined;
    const isFloating = config.mode === 'floating';

    const content = isFloating ? <ChatBubble /> : <WidgetApp />;

    if (!this.root) {
      this.root = ReactDOM.createRoot(mountEl);
    }

    this.root.render(
      <React.StrictMode>
        <I18nProvider locale={locale} currencyOverride={currencyOverride}>
          <WidgetProvider config={config}>
            <WidgetConfigProvider>
              {content}
            </WidgetConfigProvider>
          </WidgetProvider>
        </I18nProvider>
      </React.StrictMode>,
    );
  }

  private buildConfig(): SdkConfig {
    const projectKey = this.getAttribute('project-key') || '';
    const apiBase = this.getAttribute('api-base') || undefined;
    const mode = (this.getAttribute('mode') as 'floating' | 'embedded') || 'floating';
    const locale = this.getAttribute('locale') || undefined;

    const email = this.getAttribute('customer-email') || '';
    const hmac = this.getAttribute('customer-hmac') || '';
    const name = this.getAttribute('customer-name') || undefined;

    const currencySymbol = this.getAttribute('currency-symbol') || undefined;
    const currencyPosition = this.getAttribute('currency-position') as 'prefix' | 'suffix' | undefined;
    const currencyDecimals = this.getAttribute('currency-decimals');

    return {
      projectKey,
      apiBase,
      mode,
      locale,
      customer: email && hmac ? { email, hmac, name } : undefined,
      currency: currencySymbol
        ? {
            symbol: currencySymbol,
            position: currencyPosition,
            decimals: currencyDecimals ? parseInt(currencyDecimals, 10) : undefined,
          }
        : undefined,
    };
  }

  private getThemeCSS(): string {
    return `
      :host {
        --pionts-primary: ${this.getAttribute('theme-primary') || '#3b82f6'};
        --pionts-radius: ${this.getAttribute('theme-radius') || '12px'};
        --pionts-font: ${this.getAttribute('theme-font') || 'inherit'};
        position: fixed;
        bottom: 0;
        right: 0;
        z-index: 9999;
      }
      :host * {
        font-family: var(--pionts-font);
      }
    `;
  }

  // ==================== Public API ====================

  /** Dispatch a custom event from this element */
  emitEvent(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(`pionts:${name}`, {
      bubbles: true,
      composed: true,
      detail,
    }));
  }
}

// Register the custom element
if (!customElements.get('pionts-widget')) {
  customElements.define('pionts-widget', PiontsWidgetElement);
}

export { PiontsWidgetElement };
