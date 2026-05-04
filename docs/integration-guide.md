# Pionts Integration Guide

## Option A: Any Platform (API / Custom Shop)

### Step 1: Create Project in Pionts Admin

1. Login to Pionts admin dashboard
2. Create a new project → choose platform: **Custom API**
3. Copy your API keys:
   - `pk_live_...` (public key — for widget)
   - `sk_live_...` (secret key — for server API)
   - HMAC secret (for widget customer auth)

### Step 2: Install SDK

```bash
npm install @pionts/sdk
```

### Step 3: Backend — Initialize Client

```typescript
// loyalty.ts (or any service file)
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: 'https://your-pionts-server.com',  // Pionts base URL
  secretKey: process.env.PIONTS_SECRET_KEY,   // sk_live_...
});
```

### Step 4: Backend — Checkout Validation

When customer enters a discount code at checkout:

```typescript
async function validateDiscount(code: string, subtotal: number) {
  // 1. Check your own discount codes first (SUMMER20, etc.)
  const localDiscount = await db.discounts.findByCode(code);
  if (localDiscount) return localDiscount;

  // 2. Check Pionts for loyalty codes
  const result = await pionts.checkout.validate(code);
  if (result.valid) {
    return {
      type: 'loyalty',
      amount: Math.min(result.discountAmount, subtotal),
    };
  }

  return null; // Invalid code
}
```

### Step 5: Backend — After Payment

```typescript
async function onPaymentSuccess(order) {
  // Award loyalty points
  await pionts.orders.paid({
    orderId: order.id,
    email: order.customerEmail,
    customerName: order.customerName,
    orderTotal: order.total,
    currency: order.currency,
  });

  // If customer used a loyalty discount code, mark it as used
  if (order.discountSource === 'loyalty') {
    await pionts.checkout.markUsed(order.discountCode);
  }
}
```

### Step 6: Backend — Refunds

```typescript
async function onRefund(orderId: string, amount: number) {
  await pionts.orders.refunded(orderId, amount);
}
```

### Step 7: Frontend — Widget

Generate HMAC on your server (one API call per page load):

```typescript
// Server endpoint: GET /api/loyalty/widget-init
const init = await pionts.widget.init(user.email, user.name);
// Returns: { projectKey, hmac, apiBase, email, name }
```

Add to your frontend HTML:

```html
<!-- Load widget (once) -->
<script src="https://your-pionts-server.com/sdk/loyalty.js" async></script>
<script src="https://your-pionts-server.com/widget/pionts-widget.umd.js" async></script>

<script>
  // Called after both scripts load
  window.__PIONTS_CONFIG__ = {
    projectKey: '{{ projectKey }}',
    customer: {
      email: '{{ email }}',
      name: '{{ name }}',
      hmac: '{{ hmac }}',
    },
    mode: 'floating',
    apiBase: 'https://your-pionts-server.com',
    locale: 'en',
    currency: { symbol: '€', position: 'prefix', decimals: 2 },
    containerEl: document.getElementById('pionts-widget-root'),
  };
</script>
<div id="pionts-widget-root"></div>
```

### That's it — 4 backend hooks + 1 frontend snippet.

---

## Option B: Shopify

### Step 1: Install the Pionts Shopify App

1. Go to Shopify App Store → search "Pionts" (or use direct install link)
2. Click Install → authorize the app
3. The app automatically:
   - Creates your Pionts project
   - Generates API keys
   - Sets up webhooks for orders/refunds
   - Injects the widget into your theme

### Step 2: Configure in Pionts Admin

1. Login to Pionts admin (link from Shopify app)
2. Configure:
   - **Earn actions**: points per purchase, signup bonus, birthday bonus
   - **Redemption tiers**: 50pts = €5, 100pts = €10, etc.
   - **Referral rewards**: points per referral level
3. Customize widget colors in Settings > Widget

### Step 3: Done

Everything is automatic:
- Customer purchases → points awarded via Shopify webhook
- Customer redeems in widget → discount code created in Shopify
- Customer uses code at checkout → Shopify applies it
- Customer gets refund → points reversed via webhook

**Zero code needed.**

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PIONTS_API_URL` | Pionts server URL | `https://pionts.example.com/api/v2` |
| `PIONTS_SECRET_KEY` | Secret API key | `sk_live_abc123...` |
| `PIONTS_PROJECT_KEY` | Public project key (for widget) | `pk_live_xyz789...` |
| `PIONTS_HMAC_SECRET` | HMAC secret (for widget auth) | `a1b2c3d4...` |

Only `PIONTS_API_URL` and `PIONTS_SECRET_KEY` are needed for the SDK. The other two are only for the widget.

---

## API Summary

| Method | What it does | When to call |
|--------|-------------|-------------|
| `pionts.checkout.validate(code)` | Check if loyalty code is valid | Checkout — customer enters code |
| `pionts.checkout.markUsed(code)` | Mark code as used | After successful payment |
| `pionts.orders.paid(data)` | Award points for purchase | After successful payment |
| `pionts.orders.refunded(id, amount)` | Reverse points | After refund |
| `pionts.customers.get(email)` | Get balance & history | Account page |
| `pionts.customers.redeem(email, pts)` | Redeem points for code | If building custom UI |
| `pionts.widget.init(email, name)` | Get widget HMAC | Page load (authenticated) |

---

## Security Notes

- **Secret key** (`sk_live_...`) — never expose on frontend. Server-side only.
- **HMAC** — computed server-side, prevents widget impersonation.
- **Loyalty codes** — always validate with Pionts at checkout (don't trust local cache).
- **mark-used** — call after payment to prevent refund exploit.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Customer   │────▶│  Your Shop   │────▶│   Pionts    │
│   Browser    │     │   Backend    │     │   Server    │
└──────┬──────┘     └──────────────┘     └─────────────┘
       │                                        ▲
       │  Widget (floating)                     │
       └────────────────────────────────────────┘
         Direct SDK calls (balance, redeem, history)
```

- **Shop backend** → Pionts: checkout validate, mark-used, order paid/refunded
- **Widget** → Pionts: customer data, redemption, referrals (via HMAC auth)
- **Pionts** → Shop: webhook events (optional, for real-time sync)
