import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useProjectId } from '../../hooks/useProjectId';
import { SectionCard, SectionTitle, Label, HelpText } from './shared';

interface ApiKeyInfo {
  id: number;
  type: string;
  keyPrefix: string;
  label: string;
  revoked: boolean;
}

type PlatformType = 'nodejs' | 'nextjs' | 'php' | 'python';

const SNIPPETS: Record<PlatformType, { label: string; install: string; code: string }> = {
  nodejs: {
    label: 'Node.js / NestJS',
    install: 'npm install @pionts/sdk',
    code: `import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: '{{API_URL}}',
  secretKey: '{{SECRET_KEY}}',
});

// Validate discount code at checkout
const result = await pionts.checkout.validate(code);
if (result.valid) {
  // Apply discount of result.discountAmount
}

// After successful payment
await pionts.orders.paid({
  orderId: order.id,
  email: customer.email,
  orderTotal: order.total,
  currency: 'EUR',
});

// Mark loyalty code as used
await pionts.checkout.markUsed(code);`,
  },
  nextjs: {
    label: 'Next.js',
    install: 'npm install @pionts/sdk',
    code: `// app/api/checkout/validate/route.ts
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL!,
  secretKey: process.env.PIONTS_SECRET_KEY!,
});

export async function POST(req: Request) {
  const { code } = await req.json();
  const result = await pionts.checkout.validate(code);
  return Response.json(result);
}`,
  },
  php: {
    label: 'PHP / WooCommerce',
    install: 'composer require pionts/sdk (coming soon)',
    code: `// Using cURL directly until PHP SDK is available
$ch = curl_init('{{API_URL}}/api/v2/checkout/validate');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'X-Api-Key: {{SECRET_KEY}}',
  ],
  CURLOPT_POSTFIELDS => json_encode(['code' => $code]),
  CURLOPT_RETURNTRANSFER => true,
]);
$result = json_decode(curl_exec($ch), true);
curl_close($ch);

if ($result['valid']) {
  // Apply discount
}`,
  },
  python: {
    label: 'Python / Django',
    install: 'pip install pionts-sdk (coming soon)',
    code: `import requests

API_URL = '{{API_URL}}/api/v2'
SECRET_KEY = '{{SECRET_KEY}}'

headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': SECRET_KEY,
}

# Validate discount code
result = requests.post(
    f'{API_URL}/checkout/validate',
    json={'code': code},
    headers=headers,
).json()

if result['valid']:
    discount = result['discountAmount']`,
  },
};

export function IntegrationTab() {
  const projectId = useProjectId();
  const { data: keys } = useFetch<ApiKeyInfo[]>(`/api/v1/projects/${projectId}/api-keys`, []);
  const [platform, setPlatform] = useState<PlatformType>('nodejs');
  const [copied, setCopied] = useState(false);

  const secretKey = keys?.find((k) => k.type === 'secret' && !k.revoked);
  const snippet = SNIPPETS[platform];

  const apiUrl = window.location.origin;
  const code = snippet.code
    .replace(/\{\{API_URL\}\}/g, apiUrl)
    .replace(/\{\{SECRET_KEY\}\}/g, secretKey ? `${secretKey.keyPrefix}...` : 'sk_live_YOUR_KEY');

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionTitle>Integration Guide</SectionTitle>
        <HelpText>
          Follow these steps to integrate Pionts loyalty into your shop. Choose your platform below.
        </HelpText>

        {/* Platform selector */}
        <div className="mt-4 flex gap-2">
          {(Object.keys(SNIPPETS) as PlatformType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                platform === p
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {SNIPPETS[p].label}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Step 1: Install */}
      <SectionCard>
        <SectionTitle>Step 1: Install</SectionTitle>
        <div className="mt-3 rounded-lg bg-gray-900 p-4">
          <code className="text-sm text-green-400">$ {snippet.install}</code>
        </div>
      </SectionCard>

      {/* Step 2: Environment Variables */}
      <SectionCard>
        <SectionTitle>Step 2: Environment Variables</SectionTitle>
        <HelpText>Add these to your .env file:</HelpText>
        <div className="mt-3 rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          <div><span className="text-blue-400">PIONTS_API_URL</span>=<span className="text-green-400">{apiUrl}</span></div>
          <div><span className="text-blue-400">PIONTS_SECRET_KEY</span>=<span className="text-yellow-400">{secretKey ? `${secretKey.keyPrefix}...` : 'Generate an API key first'}</span></div>
        </div>
      </SectionCard>

      {/* Step 3: Code */}
      <SectionCard>
        <SectionTitle>Step 3: Integration Code</SectionTitle>
        <div className="relative mt-3">
          <button
            onClick={copyCode}
            className="absolute right-3 top-3 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
            <code>{code}</code>
          </pre>
        </div>
      </SectionCard>

      {/* Step 4: Widget */}
      <SectionCard>
        <SectionTitle>Step 4: Add Widget (Optional)</SectionTitle>
        <HelpText>Add the loyalty widget to your frontend:</HelpText>
        <div className="mt-3 rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          <code>{`<!-- Load the widget script -->\n<script src="${apiUrl}/widget/pionts-widget.js" async></script>\n\n<!-- Place the widget element -->\n<pionts-widget\n  project-key="${keys?.find((k) => k.type === 'public')?.keyPrefix || 'pk_live_...'}"\n  customer-email="user@example.com"\n  customer-hmac="computed-hmac"\n  mode="floating"\n></pionts-widget>`}</code>
        </div>
      </SectionCard>
    </div>
  );
}
