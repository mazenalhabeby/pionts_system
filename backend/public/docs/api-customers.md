# API — Customers

Read customer data, redeem points, and manage redemptions.

**Base URL:** `https://your-pionts-server.com/api/v2`
**Auth:** `X-Api-Key: sk_live_...`

---

## GET /customers/:email

Get customer balance, history, and profile.

**Response:**
```json
{
  "found": true,
  "points_balance": 145,
  "points_earned_total": 245,
  "referral_code": "btymnq",
  "birthday": "1990-06-15",
  "history": [
    { "points": 50, "type": "earn", "description": "Purchase order #123" }
  ],
  "redemptions": [
    { "id": 1, "discount_code": "8bc-xyz", "discount_amount": 5, "used": false }
  ]
}
```

Returns `{ "found": false }` if customer doesn't exist.

---

## POST /customers/:email/redeem

Redeem points for a discount code.

**Request:**
```json
{ "points": 100 }
```

**Response:**
```json
{
  "discount_code": "8bc-btymnq-abc123",
  "discount_amount": 10,
  "new_balance": 45
}
```

Fails with `400` if customer has insufficient points or the tier doesn't exist.

---

## DELETE /customers/:email/redemptions/:id

Cancel a redemption and refund points.

**Response:**
```json
{
  "points_returned": 100,
  "new_balance": 145
}
```

> [!WARNING]
> Cancel will fail (`400`) if the code is applied to a pending order or already marked as used.
