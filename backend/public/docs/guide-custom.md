# Custom API Integration

Full guide for Node.js, NestJS, Express, or any backend using the SDK.

## Environment Variables

```bash
PIONTS_API_URL=https://your-pionts-server.com
PIONTS_SECRET_KEY=sk_live_...
PIONTS_PROJECT_KEY=pk_live_...    # Only needed for widget
PIONTS_HMAC_SECRET=...            # Only needed for widget
```

## 1. Install & Initialize

```typescript
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL,
  secretKey: process.env.PIONTS_SECRET_KEY,
  timeout: 10000, // optional, default 10s
});
```

## 2. Checkout — Validate Discount Code

When a customer enters a discount code at checkout:

```typescript
async function validateDiscount(code, subtotal) {
  // Check your own discount codes first
  const local = await db.discounts.findByCode(code);
  if (local) return local;

  // Check Pionts for loyalty codes
  const result = await pionts.checkout.validate(code);
  if (result.valid) {
    return {
      type: 'loyalty',
      amount: Math.min(result.discountAmount, subtotal),
    };
  }

  return null;
}
```

> [!WARNING]
> Always validate loyalty codes with Pionts at checkout time — never trust a locally cached code. Customers can refund redemptions, which invalidates the code.

## 3. Payment Success — Award Points & Mark Used

```typescript
async function onPaymentSuccess(order) {
  // Award loyalty points
  await pionts.orders.paid({
    orderId: order.id,
    email: order.customerEmail,
    customerName: order.customerName,
    orderTotal: order.total,
    currency: order.currency,
    referralCode: order.referralCode, // optional
  });

  // If customer used a loyalty discount code
  if (order.discountType === 'loyalty') {
    await pionts.checkout.markUsed(order.discountCode);
  }
}
```

## 4. Refunds

```typescript
async function onRefund(orderId, amount) {
  await pionts.orders.refunded(orderId, amount);
}
```

## 5. Customer Data (Optional)

```typescript
const customer = await pionts.customers.get('user@example.com');
// { points_balance: 145, history: [...], redemptions: [...] }
```

## 6. Widget

See the [Widget Setup](widget.md) guide.
