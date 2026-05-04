# Error Handling

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Not enough points",
  "error": "Bad Request"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request — invalid input or business rule |
| `401` | Unauthorized — missing or invalid API key |
| `403` | Forbidden — key scope insufficient |
| `404` | Not found |
| `429` | Rate limited |
| `500` | Server error — retry with backoff |

## SDK Error Classes

```typescript
import { PiontsError, PiontsTimeoutError } from '@pionts/sdk';

try {
  await pionts.checkout.validate(code);
} catch (err) {
  if (err instanceof PiontsTimeoutError) {
    // Request timed out (default 10s)
  } else if (err instanceof PiontsError) {
    console.log(`${err.statusCode}: ${err.message}`);
    console.log(err.response); // Raw API response
  }
}
```

## Retry Behavior

The SDK automatically retries **once** on 5xx errors and network failures (1s delay). Timeouts are not retried.

Configure timeout: `new PiontsClient({ timeout: 15000 })`.

## Rate Limits

Default: **60 requests per minute** per API key. Returns `429` when exceeded.
