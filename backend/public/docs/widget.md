# Widget Setup

Add the floating loyalty widget to your storefront. It handles points display, redemption, referrals, and transaction history.

## 1. Generate HMAC (Server-Side)

The widget requires HMAC authentication. Generate it on your server:

<!-- tabs:start -->

#### **Node.js**
```typescript
const crypto = require('crypto');
const hmac = crypto
  .createHmac('sha256', process.env.PIONTS_HMAC_SECRET)
  .update(customerEmail)
  .digest('hex');
```

#### **PHP**
```php
$hmac = hash_hmac('sha256', $email, getenv('PIONTS_HMAC_SECRET'));
```

#### **Python**
```python
import hmac, hashlib, os
h = hmac.new(
    os.environ['PIONTS_HMAC_SECRET'].encode(),
    email.encode(),
    hashlib.sha256
).hexdigest()
```

#### **Go**
```go
mac := hmac.New(sha256.New, []byte(os.Getenv("PIONTS_HMAC_SECRET")))
mac.Write([]byte(email))
h := hex.EncodeToString(mac.Sum(nil))
```

<!-- tabs:end -->

Or use the SDK: `await pionts.widget.init(email, name)` returns the HMAC + all config.

## 2. Load Scripts

```html
<script src="https://YOUR_PIONTS_URL/sdk/loyalty.js" async></script>
<script src="https://YOUR_PIONTS_URL/widget/pionts-widget.umd.js" async></script>
```

## 3. Initialize

```html
<div id="pionts-root"></div>
<script>
window.__PIONTS_CONFIG__ = {
  projectKey: 'pk_live_...',
  customer: {
    email: 'user@example.com',
    name: 'John',
    hmac: 'computed-hmac-here',
  },
  mode: 'floating',
  apiBase: 'https://YOUR_PIONTS_URL',
  locale: 'en',
  currency: { symbol: '€', position: 'prefix', decimals: 2 },
  containerEl: document.getElementById('pionts-root'),
};
</script>
```

## Config Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `projectKey` | string | Yes | Public key `pk_live_...` |
| `customer` | object | For logged-in users | `{ email, name, hmac }` |
| `mode` | string | No | `'floating'` (default) |
| `apiBase` | string | No | Pionts server URL |
| `locale` | string | No | Language code: `'en'`, `'de'`, `'uk'` |
| `currency` | object | No | `{ symbol, position, decimals }` |
| `containerEl` | HTMLElement | Yes | DOM mount point |

> [!TIP]
> For React/Next.js apps, use Shadow DOM to isolate the widget CSS. See the [8BC integration](https://github.com/mazenalhabeby/our_moda) for a working example.
