# API — Checkout

Validate and manage loyalty discount codes at checkout.

**Base URL:** `https://your-pionts-server.com/api/v2`
**Auth:** `X-Api-Key: sk_live_...`

---

## POST /checkout/validate

Validate a loyalty discount code. **Scope:** `checkout` or `full`.

**Request:**
```json
{ "code": "8bc-abc123-xyz" }
```

**Response (valid):**
```json
{
  "valid": true,
  "discountAmount": 5,
  "alreadyUsed": false
}
```

**Response (invalid):**
```json
{ "valid": false }
```

---

## POST /checkout/mark-used

Mark a discount code as used after successful payment. Prevents the customer from refunding the code. **Scope:** `checkout` or `full`.

**Request:**
```json
{
  "code": "8bc-abc123-xyz",
  "orderId": "ORD-001"
}
```

**Response:**
```json
{ "success": true }
```

> [!WARNING]
> Always call `mark-used` after payment. Without it, customers can refund the redemption and get points back while keeping the discount.
