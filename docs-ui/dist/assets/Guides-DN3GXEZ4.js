import{j as e}from"./index-CKncecyL.js";import{T as n,S as i,H as r,C as t,P as o,A as d,d as s,a}from"./Docs-CxEZFsxT.js";function u(){return e.jsxs(e.Fragment,{children:[e.jsx(n,{children:"Custom API Integration"}),e.jsx(i,{children:"Full guide for Node.js, NestJS, Express, or any backend using the SDK."}),e.jsx(r,{children:"Environment Variables"}),e.jsx(t,{lang:"bash",children:`PIONTS_API_URL=https://your-pionts-server.com
PIONTS_SECRET_KEY=sk_live_...
PIONTS_PROJECT_KEY=pk_live_...    # Only needed for widget
PIONTS_HMAC_SECRET=...            # Only needed for widget`}),e.jsx(r,{children:"1. Install & Initialize"}),e.jsx(t,{lang:"typescript",children:`import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL,
  secretKey: process.env.PIONTS_SECRET_KEY,
  timeout: 10000, // optional, default 10s
});`}),e.jsx(r,{children:"2. Checkout — Validate Discount Code"}),e.jsx(o,{children:"When a customer enters a discount code at checkout:"}),e.jsx(t,{lang:"typescript",children:`async function validateDiscount(code, subtotal) {
  // Check your own discount codes first
  const local = await db.discounts.findByCode(code);
  if (local) return local;

  // Check Pionts for loyalty codes
  const result = await pionts.checkout.validate(code);
  if (result.valid) {
    return { type: 'loyalty', amount: Math.min(result.discountAmount, subtotal) };
  }
  return null;
}`}),e.jsx(d,{type:"warning",children:"Always validate loyalty codes with Pionts at checkout time — never trust a locally cached code. Customers can refund redemptions."}),e.jsx(r,{children:"3. Payment Success"}),e.jsx(t,{lang:"typescript",children:`async function onPaymentSuccess(order) {
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
}`}),e.jsx(r,{children:"4. Refunds"}),e.jsx(t,{lang:"typescript",children:"await pionts.orders.refunded(orderId, refundAmount);"}),e.jsx(r,{children:"5. Customer Data (Optional)"}),e.jsx(t,{lang:"typescript",children:`const customer = await pionts.customers.get('user@example.com');
// { points_balance: 145, history: [...], redemptions: [...] }`}),e.jsx(d,{type:"info",children:"See the Widget Setup guide to add the floating loyalty widget to your frontend."})]})}function h(){return e.jsxs(e.Fragment,{children:[e.jsx(n,{children:"Shopify Integration"}),e.jsx(i,{children:"Zero code required. Install the app and everything works automatically."}),e.jsx(s,{num:1,title:"Install the App",children:e.jsx(o,{children:'Go to the Shopify App Store, search for "Pionts", and click Install. The app automatically creates your project, generates API keys, registers webhooks, and injects the widget.'})}),e.jsx(s,{num:2,title:"Configure",children:e.jsx(a,{headers:["Setting","Description","Example"],rows:[["Earn Actions","How customers earn points","1 pt per €1, 20 pts signup bonus"],["Redemption Tiers","Points → discount","50 pts = €5, 100 pts = €10"],["Referral Rewards","Referral tree rewards","Level 1: 8 pts, Level 2: 5 pts"],["Widget","Colors, branding","Primary color, brand name"]]})}),e.jsx(s,{num:3,title:"Done",children:e.jsx(a,{headers:["Event","What Happens"],rows:[["Customer purchases","Points awarded via Shopify webhook"],["Customer redeems","Discount code created in Shopify"],["Code used at checkout","Shopify applies the discount"],["Order refunded","Points reversed via webhook"]]})}),e.jsx(d,{type:"info",children:"Optional: Add a dedicated Rewards Page in customer accounts using the Shopify Customer Account UI Extension."})]})}function p(){return e.jsxs(e.Fragment,{children:[e.jsx(n,{children:"WooCommerce Integration"}),e.jsx(i,{children:"WordPress theme snippet + WooCommerce webhooks."}),e.jsx(s,{num:1,title:"Create a Pionts Project",children:e.jsx(o,{children:"In the Pionts admin, create a project and choose WooCommerce. Copy your API keys."})}),e.jsxs(s,{num:2,title:"Add Widget to Theme",children:[e.jsxs(o,{children:["Add to your theme's footer.php before ","</body>",":"]}),e.jsx(t,{lang:"php",children:`<?php if (is_user_logged_in()):
  $user = wp_get_current_user();
  $hmac = hash_hmac('sha256', $user->user_email, 'YOUR_HMAC_SECRET');
?>
<div id="pionts-root"></div>
<script src="https://YOUR_PIONTS_URL/sdk/loyalty.js" async><\/script>
<script src="https://YOUR_PIONTS_URL/widget/pionts-widget.umd.js" async><\/script>
<script>
window.__PIONTS_CONFIG__ = {
  projectKey: 'YOUR_PROJECT_KEY',
  customer: { email: '<?= esc_js($user->user_email) ?>', hmac: '<?= $hmac ?>' },
  mode: 'floating',
  apiBase: 'https://YOUR_PIONTS_URL',
  containerEl: document.getElementById('pionts-root'),
};
<\/script>
<?php endif; ?>`})]}),e.jsxs(s,{num:3,title:"Set Up Webhooks",children:[e.jsx(o,{children:"Go to WooCommerce → Settings → Advanced → Webhooks:"}),e.jsx(a,{headers:["Name","Topic","URL"],rows:[["Pionts: Order Paid","Order completed","https://YOUR_PIONTS_URL/api/v1/webhooks/order"],["Pionts: Refund","Order refunded","https://YOUR_PIONTS_URL/api/v1/webhooks/refund"]]})]}),e.jsx(s,{num:4,title:"Configure & Test",children:e.jsx(o,{children:"In Pionts admin: set earn actions, redemption tiers, referral levels. Place a test order to verify."})})]})}function m(){return e.jsxs(e.Fragment,{children:[e.jsx(n,{children:"PHP Integration"}),e.jsx(i,{children:"For Laravel, Symfony, or raw PHP backends."}),e.jsx(r,{children:"Helper Function"}),e.jsx(t,{lang:"php",children:`function pionts_api(string $method, string $endpoint, array $data = null): array {
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
}`}),e.jsx(r,{children:"Checkout"}),e.jsx(t,{lang:"php",children:`$result = pionts_api('POST', '/checkout/validate', ['code' => $code]);
if ($result['valid'] ?? false) {
    $discount = $result['discountAmount'];
}`}),e.jsx(r,{children:"Award Points"}),e.jsx(t,{lang:"php",children:`pionts_api('POST', '/orders/paid', [
    'orderId' => $order->id, 'email' => $order->customer_email,
    'orderTotal' => $order->total, 'currency' => 'EUR',
]);
pionts_api('POST', '/checkout/mark-used', ['code' => $code]);`}),e.jsx(r,{children:"HMAC for Widget"}),e.jsx(t,{lang:"php",children:"$hmac = hash_hmac('sha256', $email, getenv('PIONTS_HMAC_SECRET'));"})]})}function _(){return e.jsxs(e.Fragment,{children:[e.jsx(n,{children:"Python Integration"}),e.jsx(i,{children:"For Django, Flask, FastAPI, or any Python backend."}),e.jsx(r,{children:"Client Class"}),e.jsx(t,{lang:"python",children:`import os, requests, hmac, hashlib

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

pionts = PiontsClient()`}),e.jsx(r,{children:"Django Example"}),e.jsx(t,{lang:"python",children:`def payment_success(request, order):
    pionts.order_paid(str(order.id), order.email, float(order.total))
    if order.loyalty_code:
        pionts.mark_used(order.loyalty_code)`})]})}export{u as GuideCustom,m as GuidePHP,_ as GuidePython,h as GuideShopify,p as GuideWooCommerce};
