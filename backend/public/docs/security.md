# Security

Best practices for securing your Pionts integration.

## API Keys

| Key Type | Format | Usage | Exposure |
|----------|--------|-------|----------|
| Public Key | `pk_live_...` | Widget init | Frontend OK |
| Secret Key | `sk_live_...` | Server API | **Server only** |
| HMAC Secret | hex string | Widget auth | **Server only** |

> [!WARNING]
> Never expose your **secret key** or **HMAC secret** on the frontend. Generate the HMAC on your server and pass only the hash to the frontend.

## Key Scopes

| Scope | Access | Use Case |
|-------|--------|----------|
| `full` | All endpoints | Default — full integration |
| `checkout` | validate + mark-used only | Restricted checkout service |
| `readonly` | GET endpoints only | Analytics, dashboards |

## HMAC Authentication

The widget uses HMAC-SHA256 to verify customer identity:

```
HMAC = SHA256(hmacSecret, customerEmail)
```

This prevents customers from impersonating others by changing the email in browser DevTools.

## Webhook Signatures

All webhook deliveries are signed:

```
X-Pionts-Signature: sha256=<hmac_of_body>
```

Verify before processing:

```typescript
import { PiontsWebhook } from '@pionts/sdk';
const isValid = PiontsWebhook.verify(rawBody, signature, secret);
```

## Checkout Security

- **Always validate loyalty codes with Pionts** — never trust locally cached codes
- **Call `mark-used` after payment** — prevents refund exploit
- **Order notifications are idempotent** — safe to retry
- **Codes are lowercase** — normalized on both sides
