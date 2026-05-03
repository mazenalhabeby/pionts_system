# @pionts/sdk

Official server-side SDK for the **Pionts** loyalty & rewards platform. Add points, referrals, and discount code redemptions to any e-commerce shop.

## Installation

```bash
npm install @pionts/sdk
```

## Quick Start

```typescript
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: 'https://your-pionts-instance.com',
  secretKey: 'sk_live_...',
});

// Validate a loyalty discount code at checkout
const result = await pionts.checkout.validate('CODE-123');
if (result.valid) {
  console.log(`Discount: ${result.discountAmount}`);
}

// Award points after payment
await pionts.orders.paid({
  orderId: 'ORD-001',
  email: 'customer@example.com',
  orderTotal: 99.99,
  currency: 'EUR',
});

// Mark discount code as used
await pionts.checkout.markUsed('CODE-123');
```

## API Reference

### `PiontsClient`

```typescript
const pionts = new PiontsClient({
  apiUrl: string,      // Pionts API base URL
  secretKey: string,   // Secret API key (sk_live_...)
  timeout?: number,    // Request timeout in ms (default: 10000)
});
```

### Checkout

```typescript
// Validate a discount code
const result = await pionts.checkout.validate(code);
// Returns: { valid: boolean, discountAmount?: number, alreadyUsed?: boolean }

// Mark a code as used after successful payment
await pionts.checkout.markUsed(code, orderId?);
// Returns: { success: boolean }
```

### Orders

```typescript
// Notify that an order was paid (awards loyalty points)
await pionts.orders.paid({
  orderId: string,
  email: string,
  customerName?: string,
  orderTotal: number,
  currency?: string,
  referralCode?: string,
});

// Notify that an order was refunded (reverses points)
await pionts.orders.refunded(orderId, refundAmount?);
```

### Customers

```typescript
// Get customer balance, history, and profile
const customer = await pionts.customers.get('user@example.com');
// Returns: { found, points_balance, points_earned_total, referral_code, history, ... }

// Redeem points for a discount code
const result = await pionts.customers.redeem('user@example.com', 100);
// Returns: { discount_code, discount_amount, new_balance }

// Cancel a redemption (refund points)
await pionts.customers.cancelRedemption('user@example.com', '123');
// Returns: { points_returned, new_balance }
```

### Config

```typescript
// Get project configuration (earn actions, tiers, settings)
const config = await pionts.config.get();
```

### Widget

```typescript
// Generate HMAC initialization data for the frontend widget
const init = await pionts.widget.init('user@example.com', 'John');
// Returns: { projectKey, hmac, apiBase, email, name }
```

## Webhook Verification

Verify incoming webhook signatures from Pionts:

```typescript
import { PiontsWebhook } from '@pionts/sdk';

app.post('/webhooks/pionts', (req, res) => {
  const signature = req.headers['x-pionts-signature'];
  const isValid = PiontsWebhook.verify(req.rawBody, signature, webhookSecret);

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook event
  const { event, data } = req.body;
  // ...
});
```

## Error Handling

```typescript
import { PiontsError, PiontsTimeoutError } from '@pionts/sdk';

try {
  await pionts.checkout.validate('CODE-123');
} catch (err) {
  if (err instanceof PiontsTimeoutError) {
    console.log('Request timed out');
  } else if (err instanceof PiontsError) {
    console.log(`API error ${err.statusCode}: ${err.message}`);
  }
}
```

## Features

- **Zero dependencies** — only uses native `fetch`
- **TypeScript-first** — full type definitions included
- **Built-in retry** — automatic single retry on 5xx errors
- **Configurable timeout** — default 10s with `AbortController`
- **Dual format** — ESM and CommonJS support
- **Webhook verification** — HMAC-SHA256 with timing-safe comparison

## Requirements

- Node.js >= 18 (uses native `fetch`)

## License

MIT
