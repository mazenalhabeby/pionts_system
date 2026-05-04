# Quick Start

Get Pionts running in your shop in 5 minutes.

## Prerequisites

- A Pionts project with API keys (from the [dashboard](/admin/))
- Node.js 18+ (or use REST API for other languages)

## 1. Install

```bash
npm install @pionts/sdk
```

## 2. Initialize

```typescript
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL,
  secretKey: process.env.PIONTS_SECRET_KEY,
});
```

## 3. Validate at Checkout

```typescript
const result = await pionts.checkout.validate(code);
if (result.valid) {
  // Apply discount of result.discountAmount
}
```

## 4. Award Points After Payment

```typescript
await pionts.orders.paid({
  orderId: order.id,
  email: customer.email,
  orderTotal: order.total,
  currency: 'EUR',
});

// If loyalty code was used:
await pionts.checkout.markUsed(code);
```

## 5. Handle Refunds

```typescript
await pionts.orders.refunded(orderId, refundAmount);
```

> [!TIP]
> See the [Widget Setup](widget.md) guide to add the floating loyalty widget to your frontend.

**That's it!** Your shop now has loyalty points. Read the full [Custom API Guide](guide-custom.md) for details.
