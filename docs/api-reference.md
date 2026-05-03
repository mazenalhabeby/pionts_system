# Pionts API v2 Reference

Base URL: `https://your-pionts-instance.com/api/v2`

All endpoints require `X-Api-Key` header with a secret key (`sk_live_...`).

---

## Checkout

### Validate Discount Code

```
POST /api/v2/checkout/validate
```

**Request:**
```json
{ "code": "8BC-BTYMNQ-abc123" }
```

**Response:**
```json
{
  "valid": true,
  "discountAmount": 5,
  "alreadyUsed": false
}
```

**Scope required:** `checkout` or `full`

---

### Mark Code as Used

```
POST /api/v2/checkout/mark-used
```

**Request:**
```json
{ "code": "8BC-BTYMNQ-abc123", "orderId": "ORD-001" }
```

**Response:**
```json
{ "success": true }
```

**Scope required:** `checkout` or `full`

---

## Orders

### Notify Order Paid

Awards loyalty points to the customer.

```
POST /api/v2/orders/paid
```

**Request:**
```json
{
  "orderId": "ORD-001",
  "email": "customer@example.com",
  "customerName": "John Doe",
  "orderTotal": 99.99,
  "currency": "EUR",
  "referralCode": "ABCDEF"
}
```

**Response:**
```json
{
  "status": "processed",
  "points_awarded": 99
}
```

---

### Notify Order Refunded

Reverses loyalty points for a refunded order.

```
POST /api/v2/orders/refunded
```

**Request:**
```json
{
  "orderId": "ORD-001",
  "refundAmount": 49.99
}
```

---

## Customers

### Get Customer

```
GET /api/v2/customers/:email
```

**Response:**
```json
{
  "found": true,
  "points_balance": 145,
  "points_earned_total": 245,
  "referral_code": "BTYMNQ",
  "birthday": "1990-06-15",
  "history": [...],
  "redemptions": [...]
}
```

---

### Redeem Points

```
POST /api/v2/customers/:email/redeem
```

**Request:**
```json
{ "points": 100 }
```

**Response:**
```json
{
  "discount_code": "8BC-BTYMNQ-xyz",
  "discount_amount": 10,
  "new_balance": 45
}
```

---

### Cancel Redemption

```
DELETE /api/v2/customers/:email/redemptions/:id
```

**Response:**
```json
{
  "points_returned": 100,
  "new_balance": 145
}
```

---

## Config

### Get Project Configuration

```
GET /api/v2/config
```

Returns earn actions, redemption tiers, referral levels, and settings.

---

## Widget

### Initialize Widget

```
POST /api/v2/widget/init
```

**Request:**
```json
{ "email": "user@example.com", "name": "John" }
```

**Response:**
```json
{
  "projectKey": "pk_live_...",
  "hmac": "abc123...",
  "apiBase": "https://pionts.example.com",
  "email": "user@example.com",
  "name": "John"
}
```

---

## Webhooks

### Register Endpoint

```
POST /api/v2/webhooks
```

**Request:**
```json
{
  "url": "https://myshop.com/webhooks/pionts",
  "events": ["redemption.created", "order.points_awarded"]
}
```

**Response:** Returns the endpoint with its HMAC secret (shown only once).

### List Endpoints

```
GET /api/v2/webhooks
```

### Delete Endpoint

```
DELETE /api/v2/webhooks/:id
```

### View Delivery Logs

```
GET /api/v2/webhooks/:id/logs?limit=50
```

### Send Test Event

```
POST /api/v2/webhooks/:id/test
```

---

## Webhook Events

| Event | Triggered When |
|-------|---------------|
| `redemption.created` | Customer redeems points for a discount code |
| `redemption.cancelled` | Customer cancels a redemption |
| `redemption.used` | Discount code is marked as used after payment |
| `order.points_awarded` | Points awarded for a paid order |
| `customer.created` | New customer registered |
| `test` | Manual test event from dashboard |

### Webhook Signature

Every delivery includes:
- `X-Pionts-Signature: sha256=<hex>` — HMAC-SHA256 of the body
- `X-Pionts-Event-Id: <uuid>` — unique idempotency key
- `X-Pionts-Event-Type: <event>` — event type

Verify with the SDK:
```typescript
import { PiontsWebhook } from '@pionts/sdk';
const isValid = PiontsWebhook.verify(rawBody, signature, endpointSecret);
```

---

## API Key Scopes

| Scope | Access |
|-------|--------|
| `full` | All endpoints (default) |
| `checkout` | Only checkout/validate and checkout/mark-used |
| `readonly` | Only GET endpoints (config, customers) |

---

## Error Format

All errors return:
```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "Bad Request"
}
```

## Rate Limits

Default: 60 requests per minute per API key.
