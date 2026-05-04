# API — Orders

Notify Pionts about order events to award or reverse points.

**Base URL:** `https://your-pionts-server.com/api/v2`
**Auth:** `X-Api-Key: sk_live_...`

---

## POST /orders/paid

Award loyalty points for a paid order. **Idempotent** — duplicate `orderId` calls are safely ignored.

**Request:**
```json
{
  "orderId": "ORD-001",
  "email": "customer@example.com",
  "customerName": "John Doe",
  "orderTotal": 99.99,
  "currency": "EUR",
  "referralCode": "abc123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | Yes | Unique order identifier |
| email | string | Yes | Customer email |
| customerName | string | No | Customer display name |
| orderTotal | number | Yes | Order total amount |
| currency | string | No | Currency code (default: project currency) |
| referralCode | string | No | Referral code used by customer |

**Response:**
```json
{ "status": "processed", "points_awarded": 99 }
```

---

## POST /orders/refunded

Reverse loyalty points for a refunded order.

**Request:**
```json
{
  "orderId": "ORD-001",
  "refundAmount": 49.99
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderId | string | Yes | The order that was refunded |
| refundAmount | number | No | Partial refund amount. Full refund if omitted. |
