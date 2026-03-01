import React from 'react';
import ReactDOM from 'react-dom/client';
import { WidgetProvider } from './context/WidgetContext';
import { WidgetConfigProvider } from './context/WidgetConfigContext';
import WidgetApp from './WidgetApp';
import './styles/widget.css';
import type { SdkConfig } from '@pionts/shared';

declare global {
  interface Window {
    __PIONTS_CONFIG__?: SdkConfig;
  }
}

const config = window.__PIONTS_CONFIG__;

if (config && config.containerEl) {
  ReactDOM.createRoot(config.containerEl).render(
    <React.StrictMode>
      <WidgetProvider config={config}>
        <WidgetConfigProvider>
          <WidgetApp />
        </WidgetConfigProvider>
      </WidgetProvider>
    </React.StrictMode>,
  );
} else {
  console.error('[Pionts] Widget config not found. Did you call Loyalty.init()?');
}
