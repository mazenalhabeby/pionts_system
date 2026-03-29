import React from 'react';
import ReactDOM from 'react-dom/client';
import { WidgetProvider } from './context/WidgetContext';
import { WidgetConfigProvider } from './context/WidgetConfigContext';
import { I18nProvider } from './i18n/I18nContext';
import { resolveLocale } from './i18n';
import WidgetApp from './WidgetApp';
import FloatingWrapper from './components/FloatingWrapper';
import ChatBubble from './components/ChatBubble';
import './styles/widget.css';
import type { SdkConfig } from '@pionts/shared';
import type { CurrencyConfig } from './i18n';

declare global {
  interface Window {
    __PIONTS_CONFIG__?: SdkConfig;
  }
}

const config = window.__PIONTS_CONFIG__;

if (config && config.containerEl) {
  const locale = resolveLocale(config);
  const currencyOverride = config.currency as Partial<CurrencyConfig> | undefined;
  const isFloating = config.mode === 'floating';

  // In floating mode, use the new chat bubble widget
  // In embedded mode, use the traditional tab-based widget
  const content = isFloating ? (
    <WidgetProvider config={config}>
      <WidgetConfigProvider>
        <ChatBubble />
      </WidgetConfigProvider>
    </WidgetProvider>
  ) : (
    <WidgetProvider config={config}>
      <WidgetConfigProvider>
        <WidgetApp />
      </WidgetConfigProvider>
    </WidgetProvider>
  );

  ReactDOM.createRoot(config.containerEl).render(
    <React.StrictMode>
      <I18nProvider locale={locale} currencyOverride={currencyOverride}>
        {content}
      </I18nProvider>
    </React.StrictMode>,
  );
} else {
  console.error('[Pionts] Widget config not found. Did you call Loyalty.init()?');
}
