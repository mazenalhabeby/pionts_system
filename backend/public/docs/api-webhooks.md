# API — Webhooks

Register endpoints to receive real-time event notifications from Pionts.

**Base URL:** `https://your-pionts-server.com/api/v2`
**Auth:** `X-Api-Key: sk_live_...`

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/webhooks` | Register a webhook endpoint |
| `GET` | `/webhooks` | List registered webhooks |
| `DELETE` | `/webhooks/:id` | Remove a webhook |
| `GET` | `/webhooks/:id/logs` | View delivery history |
| `POST` | `/webhooks/:id/test` | Send a test event |

## Register Endpoint

```json
// POST /webhooks
{
  "url": "https://myshop.com/webhooks/pionts",
  "events": ["redemption.created", "order.points_awarded"]
}
```

Returns the endpoint with its HMAC **secret** (shown only once — save it).

## Available Events

| Event | When |
|-------|------|
| `redemption.created` | Customer redeems points for a discount code |
| `redemption.cancelled` | Customer cancels a redemption |
| `redemption.used` | Discount code marked as used after payment |
| `order.points_awarded` | Points awarded for a paid order |
| `customer.created` | New customer registered |

## Delivery Headers

| Header | Description |
|--------|-------------|
| `X-Pionts-Signature` | `sha256=<hmac>` — HMAC-SHA256 of the body |
| `X-Pionts-Event-Id` | Unique event ID (idempotency key) |
| `X-Pionts-Event-Type` | Event name |

## Verify Signatures

```typescript
import { PiontsWebhook } from '@pionts/sdk';

app.post('/webhooks/pionts', (req, res) => {
  const sig = req.headers['x-pionts-signature'];
  const valid = PiontsWebhook.verify(req.rawBody, sig, endpointSecret);
  if (!valid) return res.status(401).send('Invalid signature');
  // Handle event...
});
```

## Retry Policy

Failed deliveries retry **3 times** with exponential backoff: 10s → 60s → 300s. View logs in the dashboard or via `/webhooks/:id/logs`.
