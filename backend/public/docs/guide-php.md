# PHP Integration

For Laravel, Symfony, or raw PHP backends.

## Helper Function

```php
function pionts_api(string $method, string $endpoint, array $data = null): array {
    $url = getenv('PIONTS_API_URL') . '/api/v2' . $endpoint;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-Api-Key: ' . getenv('PIONTS_SECRET_KEY'),
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true) ?: [];
}
```

## Checkout Validation

```php
$result = pionts_api('POST', '/checkout/validate', ['code' => $code]);
if ($result['valid'] ?? false) {
    $discount = $result['discountAmount'];
    // Apply discount to order
}
```

## Award Points

```php
pionts_api('POST', '/orders/paid', [
    'orderId'      => $order->id,
    'email'        => $order->customer_email,
    'customerName' => $order->customer_name,
    'orderTotal'   => $order->total,
    'currency'     => 'EUR',
]);

// Mark loyalty code as used
pionts_api('POST', '/checkout/mark-used', ['code' => $code]);
```

## Refunds

```php
pionts_api('POST', '/orders/refunded', [
    'orderId'      => $order->id,
    'refundAmount' => $refund_amount,
]);
```

## HMAC for Widget

```php
$hmac = hash_hmac('sha256', $email, getenv('PIONTS_HMAC_SECRET'));
```
