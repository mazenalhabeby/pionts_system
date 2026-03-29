import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CodeBlock from '../../components/CodeBlock';
import GuideStep from '../../components/GuideStep';
import { useProjectKeys } from '../../hooks/useProjectKeys';

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mt-3">
      <span className="text-primary mt-0.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </span>
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

type Lang = 'node' | 'python' | 'php' | 'go';

const HMAC_EXAMPLES: Record<Lang, { label: string; lang: string; code: (sk: string) => string }> = {
  node: {
    label: 'Node.js',
    lang: 'javascript',
    code: (sk) => `const crypto = require('crypto');

function generateHmac(email, secretKey) {
  return crypto
    .createHmac('sha256', secretKey)
    .update(email)
    .digest('hex');
}

// Usage
const hmac = generateHmac(user.email, '${sk}');`,
  },
  python: {
    label: 'Python',
    lang: 'python',
    code: (sk) => `import hmac
import hashlib

def generate_hmac(email: str, secret_key: str) -> str:
    return hmac.new(
        secret_key.encode(),
        email.encode(),
        hashlib.sha256
    ).hexdigest()

# Usage
signature = generate_hmac(user.email, '${sk}')`,
  },
  php: {
    label: 'PHP',
    lang: 'php',
    code: (sk) => `<?php
function generateHmac(string $email, string $secretKey): string {
    return hash_hmac('sha256', $email, $secretKey);
}

// Usage
$hmac = generateHmac($user->email, '${sk}');`,
  },
  go: {
    label: 'Go',
    lang: 'go',
    code: (sk) => `package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

func generateHMAC(email, secretKey string) string {
    mac := hmac.New(sha256.New, []byte(secretKey))
    mac.Write([]byte(email))
    return hex.EncodeToString(mac.Sum(nil))
}

// Usage
signature := generateHMAC(user.Email, "${sk}")`,
  },
};

export default function CustomGuide() {
  const navigate = useNavigate();
  const { publicKey, secretKey, apiBase, domain } = useProjectKeys();
  const [lang, setLang] = useState<Lang>('node');

  return (
    <div>
      {/* Back + header */}
      <button onClick={() => navigate('/guides')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer bg-transparent border-0 p-0 font-sans">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Guides
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: '#ff3c00' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Custom Website</h1>
          <p className="text-sm text-text-muted">Integrate Pionts with any website using the SDK and API</p>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6 mt-5">
        <GuideStep number={1} title="Generate HMAC on your server">
          <p>Your backend must sign the customer&apos;s email with your secret key. This prevents spoofing — only your server can authenticate customer identity.</p>

          {/* Language tabs */}
          <div className="flex gap-1 mt-3 mb-2">
            {(Object.keys(HMAC_EXAMPLES) as Lang[]).map((k) => (
              <button
                key={k}
                onClick={() => setLang(k)}
                className={`px-3 py-1.5 text-xs rounded-md cursor-pointer border transition-colors font-sans ${
                  lang === k
                    ? 'bg-primary text-white border-primary'
                    : 'bg-bg-surface-raised text-text-muted border-border-default hover:text-text-secondary'
                }`}
              >
                {HMAC_EXAMPLES[k].label}
              </button>
            ))}
          </div>
          <CodeBlock language={HMAC_EXAMPLES[lang].lang} code={HMAC_EXAMPLES[lang].code(secretKey)} />
        </GuideStep>

        <GuideStep number={2} title="Add the SDK to your frontend">
          <p>Include the SDK script and initialize it with the customer data from your server. Place this before <code>{'</body>'}</code>:</p>
          <CodeBlock language="html" code={`<!-- Only show for logged-in users -->
<script src="${apiBase}/sdk/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: '${publicKey}',
    customer: {
      email: 'USER_EMAIL',       // from your server
      name: 'USER_NAME',         // from your server
      hmac: 'GENERATED_HMAC'     // HMAC from step 1
    },
    mode: 'floating'             // 'floating' or 'embedded'
  });
</script>`} />
          <p className="mt-3">Replace the placeholders with actual values rendered by your server template.</p>

          <InfoBox>
            <strong>Two display modes:</strong> Use <code>floating</code> for a slide-out panel (bottom-right corner), or <code>embedded</code> to render the widget inside a specific element:<br/>
            <code className="mt-1 inline-block">Loyalty.init({'{ ... container: \'#loyalty-widget\', mode: \'embedded\' }'})</code>
          </InfoBox>
        </GuideStep>

        <GuideStep number={3} title="Handle referral links">
          <p>The SDK automatically detects <code>?ref=CODE</code> in the URL and stores a 30-day cookie. When a customer signs up, the referral is attributed automatically.</p>
          <p className="mt-2">Share referral links in this format:</p>
          <CodeBlock language="text" code={`https://${domain}?ref=REFERRAL_CODE`} />
        </GuideStep>

        <GuideStep number={4} title="Send order events from your server">
          <p>When a customer completes a purchase, send the order data to Pionts. This triggers purchase points, first-order bonuses, and 3-level referral chain rewards.</p>
          <CodeBlock language="bash" code={`# Award points for a purchase
curl -X POST ${apiBase}/api/v1/webhooks/order \\
  -H "Content-Type: application/json" \\
  -H "X-Secret-Key: ${secretKey}" \\
  -d '{
    "order_id": "ORD-12345",
    "email": "customer@example.com",
    "total": 49.99
  }'`} />
          <p className="mt-3">For refunds (claws back all points from the order):</p>
          <CodeBlock language="bash" code={`curl -X POST ${apiBase}/api/v1/webhooks/refund \\
  -H "Content-Type: application/json" \\
  -H "X-Secret-Key: ${secretKey}" \\
  -d '{ "order_id": "ORD-12345" }'`} />

          <InfoBox>
            Orders are deduplicated by <code>order_id</code>. Sending the same order twice won&apos;t award double points.
          </InfoBox>
        </GuideStep>

        <GuideStep number={5} title="Validate discount codes at checkout">
          <p>When a customer redeems points, they receive a discount code. Validate it at checkout before applying the discount:</p>
          <CodeBlock language="bash" code={`# Validate a discount code
curl -X POST ${apiBase}/api/v1/discount/validate \\
  -H "Content-Type: application/json" \\
  -H "X-Secret-Key: ${secretKey}" \\
  -d '{ "code": "DISC-ABC123" }'

# Response: { "valid": true, "discount_amount": 5.00 }

# After checkout succeeds, mark the code as used
curl -X POST ${apiBase}/api/v1/discount/mark-used \\
  -H "Content-Type: application/json" \\
  -H "X-Secret-Key: ${secretKey}" \\
  -d '{ "code": "DISC-ABC123" }'`} />
        </GuideStep>

        <GuideStep number={6} title="Optional: Widget-only login (no server integration)">
          <p>If your site doesn&apos;t have a server backend (e.g., a static site), you can let customers authenticate directly through the widget using email OTP:</p>
          <CodeBlock language="html" code={`<script src="${apiBase}/sdk/loyalty.js"></script>
<script>
  // No customer object = widget shows email login
  Loyalty.init({
    projectKey: '${publicKey}'
  });
</script>`} />
          <p className="mt-2">Customers enter their email, receive a 6-digit code, and verify. No HMAC needed — the widget handles authentication internally.</p>
        </GuideStep>

        <GuideStep number={7} title="Configure and test">
          <p>In the <strong>Settings</strong> page, set your referral base URL to <code>https://{domain}</code> and customize point values, redemption tiers, and widget appearance.</p>
          <p className="mt-2">Test checklist:</p>
          <ol className="list-decimal ml-4 space-y-1 mt-1">
            <li>Widget appears for logged-in customers</li>
            <li>Points balance loads correctly</li>
            <li>Place a test order &rarr; purchase points awarded</li>
            <li>Referral link &rarr; new signup &rarr; referral points for both</li>
            <li>Redeem points &rarr; discount code generated &rarr; validate at checkout</li>
          </ol>
        </GuideStep>
      </div>

      {/* Keys reference */}
      <div className="bg-bg-card border border-border-default rounded-xl p-5 mt-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your Project Keys</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-20 shrink-0">Public Key</span>
            <code className="text-xs bg-bg-surface-raised px-2 py-1 rounded text-text-secondary font-mono break-all">{publicKey}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-20 shrink-0">Secret Key</span>
            <code className="text-xs bg-bg-surface-raised px-2 py-1 rounded text-text-secondary font-mono break-all">{secretKey}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-20 shrink-0">API Base</span>
            <code className="text-xs bg-bg-surface-raised px-2 py-1 rounded text-text-secondary font-mono break-all">{apiBase}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
