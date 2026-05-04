import { DocsTitle, DocsSubtitle, H2, H3, P, Code, Alert, Table, Step } from './DocsComponents';

export function DocsWidget() {
  return (
    <>
      <DocsTitle>Widget Setup</DocsTitle>
      <DocsSubtitle>Add the floating loyalty widget to your storefront.</DocsSubtitle>

      <Step num={1} title="Generate HMAC (Server-Side)">
        <Code lang="typescript">{`// Using SDK:
const init = await pionts.widget.init(user.email, user.name);
// Returns: { projectKey, hmac, apiBase, email, name }

// Or manually:
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(email).digest('hex');`}</Code>
      </Step>

      <Step num={2} title="Load Scripts (Frontend)">
        <Code lang="html">{`<script src="https://YOUR_PIONTS_URL/sdk/loyalty.js" async></script>
<script src="https://YOUR_PIONTS_URL/widget/pionts-widget.umd.js" async></script>`}</Code>
      </Step>

      <Step num={3} title="Initialize">
        <Code lang="html">{`<div id="pionts-root"></div>
<script>
window.__PIONTS_CONFIG__ = {
  projectKey: 'pk_live_...',
  customer: { email: 'user@example.com', name: 'John', hmac: 'computed-hmac' },
  mode: 'floating',
  apiBase: 'https://YOUR_PIONTS_URL',
  locale: 'en',
  currency: { symbol: '€', position: 'prefix', decimals: 2 },
  containerEl: document.getElementById('pionts-root'),
};
</script>`}</Code>
      </Step>

      <H2>Config Options</H2>
      <Table headers={['Option', 'Type', 'Required', 'Description']} rows={[
        ['projectKey', 'string', 'Yes', 'Public key pk_live_...'],
        ['customer', 'object', 'Logged-in', '{ email, name, hmac }'],
        ['mode', 'string', 'No', "'floating' (default)"],
        ['apiBase', 'string', 'No', 'Pionts server URL'],
        ['locale', 'string', 'No', "'en', 'de', 'uk'"],
        ['currency', 'object', 'No', '{ symbol, position, decimals }'],
        ['containerEl', 'HTMLElement', 'Yes', 'DOM mount point'],
      ]} />
    </>
  );
}

export function DocsSecurity() {
  return (
    <>
      <DocsTitle>Security</DocsTitle>
      <DocsSubtitle>Best practices for securing your Pionts integration.</DocsSubtitle>

      <H2>API Keys</H2>
      <Table headers={['Key', 'Format', 'Usage', 'Exposure']} rows={[
        ['Public Key', 'pk_live_...', 'Widget init', 'Frontend OK'],
        ['Secret Key', 'sk_live_...', 'Server API', 'Server only'],
        ['HMAC Secret', 'hex string', 'Widget auth', 'Server only'],
      ]} />

      <Alert type="danger">Never expose your secret key or HMAC secret on the frontend.</Alert>

      <H2>Key Scopes</H2>
      <Table headers={['Scope', 'Access', 'Use Case']} rows={[
        ['full', 'All endpoints', 'Default'],
        ['checkout', 'validate + mark-used', 'Checkout service'],
        ['readonly', 'GET only', 'Analytics'],
      ]} />

      <H2>Checkout Security</H2>
      <P>Always validate loyalty codes with Pionts at checkout — never trust locally cached codes. Call mark-used after payment. Order notifications are idempotent. Codes are lowercase — normalized on both sides.</P>
    </>
  );
}

export function DocsErrors() {
  return (
    <>
      <DocsTitle>Error Handling</DocsTitle>
      <DocsSubtitle>Standard error format and SDK error classes.</DocsSubtitle>

      <H2>Error Response</H2>
      <Code lang="json">{`{ "statusCode": 400, "message": "Not enough points", "error": "Bad Request" }`}</Code>

      <H2>Status Codes</H2>
      <Table headers={['Code', 'Meaning']} rows={[
        ['200', 'Success'],
        ['400', 'Bad request — invalid input'],
        ['401', 'Unauthorized — invalid API key'],
        ['403', 'Forbidden — scope insufficient'],
        ['429', 'Rate limited'],
        ['500', 'Server error — retry'],
      ]} />

      <H2>SDK Error Handling</H2>
      <Code lang="typescript">{`import { PiontsError, PiontsTimeoutError } from '@pionts/sdk';

try {
  await pionts.checkout.validate(code);
} catch (err) {
  if (err instanceof PiontsTimeoutError) {
    // Request timed out (default 10s)
  } else if (err instanceof PiontsError) {
    console.log(\`\${err.statusCode}: \${err.message}\`);
  }
}`}</Code>
      <P>The SDK retries once on 5xx errors (1s delay). Timeouts are not retried.</P>
    </>
  );
}

export function DocsSDK() {
  return (
    <>
      <DocsTitle>SDK Reference</DocsTitle>
      <DocsSubtitle>Complete reference for @pionts/sdk.</DocsSubtitle>

      <Code lang="bash">npm install @pionts/sdk</Code>

      <H2>PiontsClient</H2>
      <Code lang="typescript">{`const pionts = new PiontsClient({
  apiUrl: string,       // Pionts server URL
  secretKey: string,    // sk_live_...
  timeout?: number,     // default: 10000
});`}</Code>

      <H2>Methods</H2>
      <Table headers={['Method', 'Returns', 'Description']} rows={[
        ['pionts.checkout.validate(code)', 'ValidateResult', 'Validate discount code'],
        ['pionts.checkout.markUsed(code)', 'MarkUsedResult', 'Mark code as used'],
        ['pionts.orders.paid(data)', 'OrderPaidResult', 'Award points'],
        ['pionts.orders.refunded(id, amount?)', 'void', 'Reverse points'],
        ['pionts.customers.get(email)', 'CustomerData', 'Get balance & history'],
        ['pionts.customers.redeem(email, pts)', 'RedeemResult', 'Redeem points'],
        ['pionts.customers.cancelRedemption(email, id)', 'CancelResult', 'Cancel redemption'],
        ['pionts.config.get()', 'ProjectConfig', 'Get project config'],
        ['pionts.widget.init(email, name?)', 'WidgetInitData', 'Generate widget HMAC'],
      ]} />

      <H2>PiontsWebhook</H2>
      <Code lang="typescript">{`PiontsWebhook.verify(rawBody, signature, secret): boolean`}</Code>

      <H2>Error Classes</H2>
      <Table headers={['Class', 'Properties', 'When']} rows={[
        ['PiontsError', 'message, statusCode, response', 'API non-2xx'],
        ['PiontsTimeoutError', 'message', 'Request timed out'],
      ]} />

      <P>npm: <a href="https://www.npmjs.com/package/@pionts/sdk" target="_blank" className="text-primary hover:underline">npmjs.com/package/@pionts/sdk</a></P>
    </>
  );
}
