import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { WidgetProvider } from './context/WidgetContext';
import { SdkConfigProvider, useWidgetConfig } from './context/WidgetConfigContext';
import WidgetApp from './WidgetApp';
import './styles/widget.css';
import type { SdkConfig } from '@pionts/shared';

declare global {
  interface Window {
    __PIONTS_CONFIG__?: SdkConfig;
  }
}

function ThemeApplier({ container, children }: { container: HTMLElement; children: React.ReactNode }) {
  const { settings } = useWidgetConfig();

  useEffect(() => {
    if (!settings || !container) return;
    if (settings.widget_primary_color) container.style.setProperty('--pionts-primary', settings.widget_primary_color);
    if (settings.widget_bg_color) container.style.setProperty('--pionts-bg', settings.widget_bg_color);
    if (settings.widget_text_color) container.style.setProperty('--pionts-text', settings.widget_text_color);
  }, [settings, container]);

  return <>{children}</>;
}

const config = window.__PIONTS_CONFIG__;

if (config && config.containerEl) {
  ReactDOM.createRoot(config.containerEl).render(
    <React.StrictMode>
      <WidgetProvider config={config}>
        <SdkConfigProvider>
          <ThemeApplier container={config.containerEl}>
            <WidgetApp />
          </ThemeApplier>
        </SdkConfigProvider>
      </WidgetProvider>
    </React.StrictMode>,
  );
} else {
  console.error('[Pionts] Widget config not found. Did you call Loyalty.init()?');
}
