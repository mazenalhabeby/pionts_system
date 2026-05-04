# API — Config & Widget

Retrieve project configuration and generate widget init data.

**Base URL:** `https://your-pionts-server.com/api/v2`
**Auth:** `X-Api-Key: sk_live_...`

---

## GET /config

Returns the full project configuration: earn actions, redemption tiers, referral levels, enabled modules, and public settings. Cached for 5 minutes.

---

## POST /widget/init

Generate HMAC and config data for the frontend widget. Call this server-side for each logged-in user.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John"
}
```

**Response:**
```json
{
  "projectKey": "pk_live_...",
  "hmac": "a1b2c3d4...",
  "apiBase": "https://pionts.example.com",
  "email": "user@example.com",
  "name": "John"
}
```

Pass these values to the frontend `__PIONTS_CONFIG__`. See [Widget Setup](widget.md).
