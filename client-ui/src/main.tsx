/**
 * Dev harness — renders the Pionts widget full-page (embedded mode).
 * This file is used only during `vite dev` and is NOT included in the UMD production build.
 */

const PROJECT_KEY = 'pk_live_brew_test_public_key_001';
const SECRET_KEY = 'sk_live_brew_test_secret_key_001';
const API_BASE = 'http://localhost:3000';
const CUSTOMER_EMAIL = 'olivia@test.com';
const CUSTOMER_NAME = 'Olivia Martinez';

async function computeHmac(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function boot() {
  const app = document.getElementById('app')!;
  app.innerHTML = '<div id="pionts-root" style="min-height:100vh"></div>';

  const hmac = await computeHmac(CUSTOMER_EMAIL, SECRET_KEY);

  window.__PIONTS_CONFIG__ = {
    projectKey: PROJECT_KEY,
    apiBase: API_BASE,
    customer: { email: CUSTOMER_EMAIL, name: CUSTOMER_NAME, hmac },
    mode: 'embedded',
    containerEl: document.getElementById('pionts-root')!,
  };

  await import('./main-sdk');
}

boot();
