# Quick Start — Integrate Pionts in 5 Minutes

## 1. Get Your API Keys

1. Log in to the Pionts admin dashboard
2. Go to **Settings > API Keys**
3. Copy your **Secret Key** (`sk_live_...`)
4. Note your Pionts API URL

## 2. Install the SDK

```bash
npm install @pionts/sdk
```

## 3. Initialize the Client

```typescript
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: 'https://your-pionts-instance.com',
  secretKey: process.env.PIONTS_SECRET_KEY!,
});
```

## 4. Validate Discount Codes at Checkout

When a customer enters a discount code at checkout:

```typescript
const result = await pionts.checkout.validate(code);

if (result.valid) {
  // Apply discount of result.discountAmount to the order
  order.discount = result.discountAmount;
}
```

## 5. Award Points After Payment

When payment succeeds:

```typescript
await pionts.orders.paid({
  orderId: order.id,
  email: customer.email,
  orderTotal: order.total,
  currency: 'EUR',
});

// If a loyalty code was used, mark it
if (loyaltyCodeUsed) {
  await pionts.checkout.markUsed(loyaltyCodeUsed);
}
```

## 6. Add the Widget (Optional)

Load the widget script in your HTML:

```html
<script src="https://your-pionts-instance.com/widget/pionts-widget.js" async></script>
```

Add the widget element (generate HMAC server-side):

```html
<pionts-widget
  project-key="pk_live_..."
  customer-email="user@example.com"
  customer-hmac="<server-computed-hmac>"
  mode="floating"
></pionts-widget>
```

Generate the HMAC on your server:

```typescript
const init = await pionts.widget.init(customer.email, customer.name);
// Pass init.hmac to the frontend
```

## 7. Handle Refunds

When an order is refunded:

```typescript
await pionts.orders.refunded(order.id, refundAmount);
```

---

That's it! Your shop now has a fully integrated loyalty program.

For more details, see the [API Reference](./api-reference.md).
