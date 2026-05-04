import { DocsTitle, DocsSubtitle, H2, H3, P, Step, Code, Alert, Table, Endpoint, Method } from './DocsComponents';

// ==================== Custom API ====================
export function GuideCustom() {
  return (
    <>
      <DocsTitle>Custom API Integration</DocsTitle>
      <DocsSubtitle>Full guide for Node.js, NestJS, Express, or any backend using the SDK.</DocsSubtitle>

      <H2>Environment Variables</H2>
      <Code lang="bash">{`PIONTS_API_URL=https://your-pionts-server.com
PIONTS_SECRET_KEY=sk_live_...
PIONTS_PROJECT_KEY=pk_live_...    # Only needed for widget
PIONTS_HMAC_SECRET=...            # Only needed for widget`}</Code>

      <H2>1. Install & Initialize</H2>
      <Code lang="typescript">{`import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL,
  secretKey: process.env.PIONTS_SECRET_KEY,
  timeout: 10000, // optional, default 10s
});`}</Code>

      <H2>2. Checkout — Validate Discount Code</H2>
      <P>When a customer enters a discount code at checkout:</P>
      <Code lang="typescript">{`async function validateDiscount(code, subtotal) {
  // Check your own discount codes first
  const local = await db.discounts.findByCode(code);
  if (local) return local;

  // Check Pionts for loyalty codes
  const result = await pionts.checkout.validate(code);
  if (result.valid) {
    return { type: 'loyalty', amount: Math.min(result.discountAmount, subtotal) };
  }
  return null;
}`}</Code>
      <Alert type="warning">Always validate loyalty codes with Pionts at checkout time — never trust a locally cached code. Customers can refund redemptions.</Alert>

      <H2>3. Payment Success</H2>
      <Code lang="typescript">{`async function onPaymentSuccess(order) {
  await pionts.orders.paid({
    orderId: order.id,
    email: order.customerEmail,
    customerName: order.customerName,
    orderTotal: order.total,
    currency: order.currency,
  });

  if (order.discountType === 'loyalty') {
    await pionts.checkout.markUsed(order.discountCode);
  }
}`}</Code>

      <H2>4. Refunds</H2>
      <Code lang="typescript">{`await pionts.orders.refunded(orderId, refundAmount);`}</Code>

      <H2>5. Customer Data (Optional)</H2>
      <Code lang="typescript">{`const customer = await pionts.customers.get('user@example.com');
// { points_balance: 145, history: [...], redemptions: [...] }`}</Code>

      <Alert type="info">See the Widget Setup guide to add the floating loyalty widget to your frontend.</Alert>
    </>
  );
}

// ==================== Shopify ====================
export function GuideShopify() {
  return (
    <>
      <DocsTitle>Shopify Integration</DocsTitle>
      <DocsSubtitle>Zero code required. Install the app and everything works automatically.</DocsSubtitle>

      <Step num={1} title="Install the App">
        <P>Go to the Shopify App Store, search for "Pionts", and click Install. The app automatically creates your project, generates API keys, registers webhooks, and injects the widget.</P>
      </Step>

      <Step num={2} title="Configure">
        <Table headers={['Setting', 'Description', 'Example']} rows={[
          ['Earn Actions', 'How customers earn points', '1 pt per €1, 20 pts signup bonus'],
          ['Redemption Tiers', 'Points → discount', '50 pts = €5, 100 pts = €10'],
          ['Referral Rewards', 'Referral tree rewards', 'Level 1: 8 pts, Level 2: 5 pts'],
          ['Widget', 'Colors, branding', 'Primary color, brand name'],
        ]} />
      </Step>

      <Step num={3} title="Done">
        <Table headers={['Event', 'What Happens']} rows={[
          ['Customer purchases', 'Points awarded via Shopify webhook'],
          ['Customer redeems', 'Discount code created in Shopify'],
          ['Code used at checkout', 'Shopify applies the discount'],
          ['Order refunded', 'Points reversed via webhook'],
        ]} />
      </Step>

      <Alert type="info">Optional: Add a dedicated Rewards Page in customer accounts using the Shopify Customer Account UI Extension.</Alert>
    </>
  );
}

// ==================== WooCommerce ====================
export function GuideWooCommerce() {
  return (
    <>
      <DocsTitle>WooCommerce Integration</DocsTitle>
      <DocsSubtitle>WordPress theme snippet + WooCommerce webhooks.</DocsSubtitle>

      <Step num={1} title="Create a Pionts Project">
        <P>In the Pionts admin, create a project and choose WooCommerce. Copy your API keys.</P>
      </Step>

      <Step num={2} title="Add Widget to Theme">
        <P>Add to your theme's footer.php before {'</body>'}:</P>
        <Code lang="php">{`<?php if (is_user_logged_in()):
  $user = wp_get_current_user();
  $hmac = hash_hmac('sha256', $user->user_email, 'YOUR_HMAC_SECRET');
?>
<div id="pionts-root"></div>
<script src="https://YOUR_PIONTS_URL/sdk/loyalty.js" async></script>
<script src="https://YOUR_PIONTS_URL/widget/pionts-widget.umd.js" async></script>
<script>
window.__PIONTS_CONFIG__ = {
  projectKey: 'YOUR_PROJECT_KEY',
  customer: { email: '<?= esc_js($user->user_email) ?>', hmac: '<?= $hmac ?>' },
  mode: 'floating',
  apiBase: 'https://YOUR_PIONTS_URL',
  containerEl: document.getElementById('pionts-root'),
};
</script>
<?php endif; ?>`}</Code>
      </Step>

      <Step num={3} title="Set Up Webhooks">
        <P>Go to WooCommerce → Settings → Advanced → Webhooks:</P>
        <Table headers={['Name', 'Topic', 'URL']} rows={[
          ['Pionts: Order Paid', 'Order completed', 'https://YOUR_PIONTS_URL/api/v1/webhooks/order'],
          ['Pionts: Refund', 'Order refunded', 'https://YOUR_PIONTS_URL/api/v1/webhooks/refund'],
        ]} />
      </Step>

      <Step num={4} title="Configure & Test">
        <P>In Pionts admin: set earn actions, redemption tiers, referral levels. Place a test order to verify.</P>
      </Step>
    </>
  );
}

// ==================== PHP ====================
export function GuidePHP() {
  return (
    <>
      <DocsTitle>PHP Integration</DocsTitle>
      <DocsSubtitle>For Laravel, Symfony, or raw PHP backends.</DocsSubtitle>

      <H2>Helper Function</H2>
      <Code lang="php">{`function pionts_api(string $method, string $endpoint, array $data = null): array {
    $url = getenv('PIONTS_API_URL') . '/api/v2' . $endpoint;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'X-Api-Key: ' . getenv('PIONTS_SECRET_KEY')],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true) ?: [];
}`}</Code>

      <H2>Checkout</H2>
      <Code lang="php">{`$result = pionts_api('POST', '/checkout/validate', ['code' => $code]);
if ($result['valid'] ?? false) {
    $discount = $result['discountAmount'];
}`}</Code>

      <H2>Award Points</H2>
      <Code lang="php">{`pionts_api('POST', '/orders/paid', [
    'orderId' => $order->id, 'email' => $order->customer_email,
    'orderTotal' => $order->total, 'currency' => 'EUR',
]);
pionts_api('POST', '/checkout/mark-used', ['code' => $code]);`}</Code>

      <H2>HMAC for Widget</H2>
      <Code lang="php">{`$hmac = hash_hmac('sha256', $email, getenv('PIONTS_HMAC_SECRET'));`}</Code>
    </>
  );
}

// ==================== Python ====================
export function GuidePython() {
  return (
    <>
      <DocsTitle>Python Integration</DocsTitle>
      <DocsSubtitle>For Django, Flask, FastAPI, or any Python backend.</DocsSubtitle>

      <H2>Client Class</H2>
      <Code lang="python">{`import os, requests, hmac, hashlib

class PiontsClient:
    def __init__(self):
        self.base = os.environ['PIONTS_API_URL'] + '/api/v2'
        self.headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': os.environ['PIONTS_SECRET_KEY'],
        }

    def validate(self, code):
        return requests.post(f'{self.base}/checkout/validate',
            json={'code': code}, headers=self.headers, timeout=10).json()

    def mark_used(self, code):
        requests.post(f'{self.base}/checkout/mark-used',
            json={'code': code}, headers=self.headers, timeout=10)

    def order_paid(self, order_id, email, total, currency='EUR'):
        requests.post(f'{self.base}/orders/paid', json={
            'orderId': order_id, 'email': email,
            'orderTotal': total, 'currency': currency,
        }, headers=self.headers, timeout=10)

pionts = PiontsClient()`}</Code>

      <H2>Django Example</H2>
      <Code lang="python">{`def payment_success(request, order):
    pionts.order_paid(str(order.id), order.email, float(order.total))
    if order.loyalty_code:
        pionts.mark_used(order.loyalty_code)`}</Code>
    </>
  );
}
