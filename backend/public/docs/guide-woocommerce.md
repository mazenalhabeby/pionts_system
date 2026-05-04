# WooCommerce Integration

WordPress theme snippet + WooCommerce webhooks. No plugin required.

## Step 1: Create a Pionts Project

In the Pionts admin, create a project and choose **WooCommerce**. Copy your API keys.

## Step 2: Add Widget to Theme

Add to your theme's `footer.php` before `</body>`:

```php
<?php if (is_user_logged_in()):
  $user = wp_get_current_user();
  $email = $user->user_email;
  $name = $user->display_name;
  $hmac = hash_hmac('sha256', $email, 'YOUR_HMAC_SECRET');
?>
<div id="pionts-root"></div>
<script src="https://YOUR_PIONTS_URL/sdk/loyalty.js" async></script>
<script src="https://YOUR_PIONTS_URL/widget/pionts-widget.umd.js" async></script>
<script>
window.__PIONTS_CONFIG__ = {
  projectKey: 'YOUR_PROJECT_KEY',
  customer: {
    email: '<?= esc_js($email) ?>',
    name: '<?= esc_js($name) ?>',
    hmac: '<?= $hmac ?>'
  },
  mode: 'floating',
  apiBase: 'https://YOUR_PIONTS_URL',
  containerEl: document.getElementById('pionts-root'),
};
</script>
<?php endif; ?>
```

## Step 3: Set Up Webhooks

Go to **WooCommerce → Settings → Advanced → Webhooks** and add:

| Name | Topic | Delivery URL | Secret |
|------|-------|-------------|--------|
| Pionts: Order Paid | Order completed | `https://YOUR_PIONTS_URL/api/v1/webhooks/order` | Your secret key |
| Pionts: Refund | Order refunded | `https://YOUR_PIONTS_URL/api/v1/webhooks/refund` | Your secret key |

## Step 4: Validate Loyalty Codes (Optional)

Add to `functions.php`:

```php
add_filter('woocommerce_coupon_is_valid', function($valid, $coupon) {
  $code = $coupon->get_code();
  $response = wp_remote_post('https://YOUR_PIONTS_URL/api/v2/checkout/validate', [
    'headers' => [
      'Content-Type' => 'application/json',
      'X-Api-Key' => 'YOUR_SECRET_KEY',
    ],
    'body' => json_encode(['code' => $code]),
    'timeout' => 5,
  ]);

  $body = json_decode(wp_remote_retrieve_body($response), true);
  if ($body && $body['valid']) {
    $coupon->set_amount($body['discountAmount']);
    $coupon->set_discount_type('fixed_cart');
    return true;
  }
  return $valid;
}, 10, 2);
```

## Step 5: Configure & Test

In Pionts admin: set earn actions, redemption tiers, referral levels. Place a test order to verify.
