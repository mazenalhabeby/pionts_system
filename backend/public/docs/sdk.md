# SDK Reference

Complete reference for the `@pionts/sdk` npm package.

```bash
npm install @pionts/sdk
```

## PiontsClient

```typescript
import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: string,       // Pionts server URL
  secretKey: string,    // sk_live_...
  timeout?: number,     // Request timeout ms (default: 10000)
});
```

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `pionts.checkout.validate(code)` | `ValidateResult` | Validate discount code |
| `pionts.checkout.markUsed(code, orderId?)` | `MarkUsedResult` | Mark code as used |
| `pionts.orders.paid(data)` | `OrderPaidResult` | Award points |
| `pionts.orders.refunded(id, amount?)` | `void` | Reverse points |
| `pionts.customers.get(email)` | `CustomerData` | Get balance & history |
| `pionts.customers.redeem(email, pts)` | `RedeemResult` | Redeem points |
| `pionts.customers.cancelRedemption(email, id)` | `CancelResult` | Cancel redemption |
| `pionts.config.get()` | `ProjectConfig` | Get project config |
| `pionts.widget.init(email, name?)` | `WidgetInitData` | Generate widget HMAC |

## PiontsWebhook

```typescript
import { PiontsWebhook } from '@pionts/sdk';

PiontsWebhook.verify(
  rawBody: string | Buffer,  // Request body
  signature: string,          // X-Pionts-Signature header
  secret: string,             // Endpoint secret
): boolean
```

## Error Classes

| Class | Properties | When |
|-------|-----------|------|
| `PiontsError` | `message, statusCode, response` | API returned non-2xx |
| `PiontsTimeoutError` | `message` | Request timed out |

## Features

- Zero runtime dependencies (native `fetch`)
- TypeScript-first with full type definitions
- Built-in retry on 5xx (once, 1s delay)
- Configurable timeout via `AbortController`
- ESM + CommonJS dual output

**npm:** [npmjs.com/package/@pionts/sdk](https://www.npmjs.com/package/@pionts/sdk)

**GitHub:** [github.com/mazenalhabeby/pionts_system](https://github.com/mazenalhabeby/pionts_system)
