import{j as e}from"./index-Bb-IRV5E.js";import{T as i,S as n,H as t,C as s,a as r,P as a,A as c,d as o}from"./Docs-DWfqreAW.js";function p(){return e.jsxs(e.Fragment,{children:[e.jsx(i,{children:"Widget Setup"}),e.jsx(n,{children:"Add the floating loyalty widget to your storefront."}),e.jsx(o,{num:1,title:"Generate HMAC (Server-Side)",children:e.jsx(s,{lang:"typescript",children:`// Using SDK:
const init = await pionts.widget.init(user.email, user.name);
// Returns: { projectKey, hmac, apiBase, email, name }

// Or manually:
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(email).digest('hex');`})}),e.jsx(o,{num:2,title:"Load Scripts (Frontend)",children:e.jsx(s,{lang:"html",children:`<script src="https://YOUR_PIONTS_URL/sdk/loyalty.js" async><\/script>
<script src="https://YOUR_PIONTS_URL/widget/pionts-widget.umd.js" async><\/script>`})}),e.jsx(o,{num:3,title:"Initialize",children:e.jsx(s,{lang:"html",children:`<div id="pionts-root"></div>
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
<\/script>`})}),e.jsx(t,{children:"Config Options"}),e.jsx(r,{headers:["Option","Type","Required","Description"],rows:[["projectKey","string","Yes","Public key pk_live_..."],["customer","object","Logged-in","{ email, name, hmac }"],["mode","string","No","'floating' (default)"],["apiBase","string","No","Pionts server URL"],["locale","string","No","'en', 'de', 'uk'"],["currency","object","No","{ symbol, position, decimals }"],["containerEl","HTMLElement","Yes","DOM mount point"]]})]})}function u(){return e.jsxs(e.Fragment,{children:[e.jsx(i,{children:"Security"}),e.jsx(n,{children:"Best practices for securing your Pionts integration."}),e.jsx(t,{children:"API Keys"}),e.jsx(r,{headers:["Key","Format","Usage","Exposure"],rows:[["Public Key","pk_live_...","Widget init","Frontend OK"],["Secret Key","sk_live_...","Server API","Server only"],["HMAC Secret","hex string","Widget auth","Server only"]]}),e.jsx(c,{type:"danger",children:"Never expose your secret key or HMAC secret on the frontend."}),e.jsx(t,{children:"Key Scopes"}),e.jsx(r,{headers:["Scope","Access","Use Case"],rows:[["full","All endpoints","Default"],["checkout","validate + mark-used","Checkout service"],["readonly","GET only","Analytics"]]}),e.jsx(t,{children:"Checkout Security"}),e.jsx(a,{children:"Always validate loyalty codes with Pionts at checkout — never trust locally cached codes. Call mark-used after payment. Order notifications are idempotent. Codes are lowercase — normalized on both sides."})]})}function m(){return e.jsxs(e.Fragment,{children:[e.jsx(i,{children:"Error Handling"}),e.jsx(n,{children:"Standard error format and SDK error classes."}),e.jsx(t,{children:"Error Response"}),e.jsx(s,{lang:"json",children:'{ "statusCode": 400, "message": "Not enough points", "error": "Bad Request" }'}),e.jsx(t,{children:"Status Codes"}),e.jsx(r,{headers:["Code","Meaning"],rows:[["200","Success"],["400","Bad request — invalid input"],["401","Unauthorized — invalid API key"],["403","Forbidden — scope insufficient"],["429","Rate limited"],["500","Server error — retry"]]}),e.jsx(t,{children:"SDK Error Handling"}),e.jsx(s,{lang:"typescript",children:`import { PiontsError, PiontsTimeoutError } from '@pionts/sdk';

try {
  await pionts.checkout.validate(code);
} catch (err) {
  if (err instanceof PiontsTimeoutError) {
    // Request timed out (default 10s)
  } else if (err instanceof PiontsError) {
    console.log(\`\${err.statusCode}: \${err.message}\`);
  }
}`}),e.jsx(a,{children:"The SDK retries once on 5xx errors (1s delay). Timeouts are not retried."})]})}function h(){return e.jsxs(e.Fragment,{children:[e.jsx(i,{children:"SDK Reference"}),e.jsx(n,{children:"Complete reference for @pionts/sdk."}),e.jsx(s,{lang:"bash",children:"npm install @pionts/sdk"}),e.jsx(t,{children:"PiontsClient"}),e.jsx(s,{lang:"typescript",children:`const pionts = new PiontsClient({
  apiUrl: string,       // Pionts server URL
  secretKey: string,    // sk_live_...
  timeout?: number,     // default: 10000
});`}),e.jsx(t,{children:"Methods"}),e.jsx(r,{headers:["Method","Returns","Description"],rows:[["pionts.checkout.validate(code)","ValidateResult","Validate discount code"],["pionts.checkout.markUsed(code)","MarkUsedResult","Mark code as used"],["pionts.orders.paid(data)","OrderPaidResult","Award points"],["pionts.orders.refunded(id, amount?)","void","Reverse points"],["pionts.customers.get(email)","CustomerData","Get balance & history"],["pionts.customers.redeem(email, pts)","RedeemResult","Redeem points"],["pionts.customers.cancelRedemption(email, id)","CancelResult","Cancel redemption"],["pionts.config.get()","ProjectConfig","Get project config"],["pionts.widget.init(email, name?)","WidgetInitData","Generate widget HMAC"]]}),e.jsx(t,{children:"PiontsWebhook"}),e.jsx(s,{lang:"typescript",children:"PiontsWebhook.verify(rawBody, signature, secret): boolean"}),e.jsx(t,{children:"Error Classes"}),e.jsx(r,{headers:["Class","Properties","When"],rows:[["PiontsError","message, statusCode, response","API non-2xx"],["PiontsTimeoutError","message","Request timed out"]]}),e.jsxs(a,{children:["npm: ",e.jsx("a",{href:"https://www.npmjs.com/package/@pionts/sdk",target:"_blank",className:"text-primary hover:underline",children:"npmjs.com/package/@pionts/sdk"})]})]})}export{m as DocsErrors,h as DocsSDK,u as DocsSecurity,p as DocsWidget};
