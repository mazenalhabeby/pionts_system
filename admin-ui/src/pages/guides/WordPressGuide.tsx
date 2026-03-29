import { useNavigate } from 'react-router-dom';
import CodeBlock from '../../components/CodeBlock';
import GuideStep from '../../components/GuideStep';
import { useProjectKeys } from '../../hooks/useProjectKeys';

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mt-3">
      <span className="text-primary mt-0.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      </span>
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-warning-dim border border-warning/20 rounded-lg px-4 py-3 mt-3">
      <span className="text-warning mt-0.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </span>
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

export default function WordPressGuide() {
  const navigate = useNavigate();
  const { publicKey, secretKey, apiBase, domain } = useProjectKeys();

  return (
    <div>
      {/* Back + header */}
      <button onClick={() => navigate('/guides')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer bg-transparent border-0 p-0 font-sans">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Guides
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: '#21759b' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">WordPress / WooCommerce</h1>
          <p className="text-sm text-text-muted">Add loyalty rewards to your WordPress site</p>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6 mt-5">
        <GuideStep number={1} title="Get your API keys">
          <p>Go to the <strong>API Keys</strong> page in this dashboard and copy your public key and secret key. You'll need both for the integration.</p>
          <div className="bg-bg-surface-raised rounded-lg p-3 mt-2 space-y-1 font-mono text-xs">
            <div><span className="text-text-faint">Public:</span> <span className="text-text-secondary">{publicKey}</span></div>
            <div><span className="text-text-faint">Secret:</span> <span className="text-text-secondary">{secretKey}</span></div>
          </div>
        </GuideStep>

        <GuideStep number={2} title="Add the SDK snippet to your theme">
          <p>In your WordPress admin, go to <strong>Appearance &rarr; Theme File Editor</strong>. Open your theme's <code>footer.php</code> (or use a plugin like &quot;Insert Headers and Footers&quot;). Add this before <code>{'</body>'}</code>:</p>
          <CodeBlock language="php" code={`<?php if (is_user_logged_in()):
  $user = wp_get_current_user();
  $secret_key = '${secretKey}';
  $hmac = hash_hmac('sha256', $user->user_email, $secret_key);
?>
<script src="${apiBase}/sdk/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: '${publicKey}',
    customer: {
      email: '<?= esc_attr($user->user_email) ?>',
      name: '<?= esc_attr($user->first_name) ?>',
      hmac: '<?= $hmac ?>'
    }
  });
</script>
<?php endif; ?>`} />
          <WarningBox>
            <strong>Security:</strong> The secret key is used server-side in PHP to generate the HMAC. Never expose it in client-side JavaScript. The HMAC ensures only your server can authenticate customers.
          </WarningBox>
        </GuideStep>

        <GuideStep number={3} title="Handle referral links">
          <p>The SDK automatically picks up <code>?ref=CODE</code> from the URL and stores a 30-day cookie. Make sure your WordPress site preserves query parameters when customers browse.</p>
          <p className="mt-2">Referral links look like: <code>https://{domain}?ref=ABC123</code></p>
          <InfoBox>
            If a visitor arrives via a referral link and later signs up, the referral is automatically attributed — even if they close the browser and come back within 30 days.
          </InfoBox>
        </GuideStep>

        <GuideStep number={4} title="Set up WooCommerce webhooks">
          <p>To award points on purchases, you need to send order data to Pionts. In WooCommerce, go to <strong>WooCommerce &rarr; Settings &rarr; Advanced &rarr; Webhooks</strong> and create two webhooks:</p>

          <div className="bg-bg-surface-raised rounded-lg p-4 mt-3 space-y-4">
            <div>
              <div className="text-xs text-text-faint uppercase tracking-wider mb-1">Webhook 1 — Order Completed</div>
              <div className="space-y-1 text-sm">
                <div><span className="text-text-faint w-24 inline-block">Name:</span> <span className="text-text-secondary">Pionts — Order Created</span></div>
                <div><span className="text-text-faint w-24 inline-block">Status:</span> <span className="text-text-secondary">Active</span></div>
                <div><span className="text-text-faint w-24 inline-block">Topic:</span> <span className="text-text-secondary">Order completed</span></div>
                <div><span className="text-text-faint w-24 inline-block">Delivery URL:</span> <code className="text-xs text-text-secondary">{apiBase}/api/v1/webhooks/order</code></div>
                <div><span className="text-text-faint w-24 inline-block">Secret:</span> <code className="text-xs text-text-secondary">{secretKey}</code></div>
              </div>
            </div>
            <div className="border-t border-border-default pt-4">
              <div className="text-xs text-text-faint uppercase tracking-wider mb-1">Webhook 2 — Order Refunded</div>
              <div className="space-y-1 text-sm">
                <div><span className="text-text-faint w-24 inline-block">Name:</span> <span className="text-text-secondary">Pionts — Refund Created</span></div>
                <div><span className="text-text-faint w-24 inline-block">Status:</span> <span className="text-text-secondary">Active</span></div>
                <div><span className="text-text-faint w-24 inline-block">Topic:</span> <span className="text-text-secondary">Order refunded</span></div>
                <div><span className="text-text-faint w-24 inline-block">Delivery URL:</span> <code className="text-xs text-text-secondary">{apiBase}/api/v1/webhooks/refund</code></div>
                <div><span className="text-text-faint w-24 inline-block">Secret:</span> <code className="text-xs text-text-secondary">{secretKey}</code></div>
              </div>
            </div>
          </div>

          <p className="mt-3">The webhook sends the order data including customer email and order total. Pionts handles the rest — purchase points, first-order bonus, and 3-level referral chain rewards.</p>
        </GuideStep>

        <GuideStep number={5} title="Optional: Validate discount codes at checkout">
          <p>When customers redeem points, they get a discount code. To validate it on your WooCommerce checkout, add a custom validation hook or use the Pionts API:</p>
          <CodeBlock language="php" code={`// In your theme's functions.php or a custom plugin
add_action('woocommerce_applied_coupon', function($coupon_code) {
  $response = wp_remote_post('${apiBase}/api/v1/discount/validate', [
    'headers' => [
      'Content-Type' => 'application/json',
      'X-Secret-Key' => '${secretKey}',
    ],
    'body' => json_encode(['code' => $coupon_code]),
  ]);

  $data = json_decode(wp_remote_retrieve_body($response), true);
  if (!empty($data['valid'])) {
    // Discount code is valid — WooCommerce handles the rest
  }
});

// After successful checkout, mark as used
add_action('woocommerce_thankyou', function($order_id) {
  $order = wc_get_order($order_id);
  $coupons = $order->get_coupon_codes();
  foreach ($coupons as $code) {
    wp_remote_post('${apiBase}/api/v1/discount/mark-used', [
      'headers' => [
        'Content-Type' => 'application/json',
        'X-Secret-Key' => '${secretKey}',
      ],
      'body' => json_encode(['code' => $code]),
    ]);
  }
});`} />
          <InfoBox>
            This step is optional. Customers can also manually enter their discount codes at checkout without any custom integration — it works like any coupon code.
          </InfoBox>
        </GuideStep>

        <GuideStep number={6} title="Configure your project settings">
          <p>In the Pionts dashboard <strong>Settings</strong> page, make sure to set:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2">
            <li><strong>Referral base URL</strong> — your WordPress site domain (e.g., <code>https://{domain}</code>)</li>
            <li><strong>Points values</strong> — customize how many points per action</li>
            <li><strong>Redemption tiers</strong> — configure discount amounts for each tier</li>
            <li><strong>Widget appearance</strong> — match your brand colors</li>
          </ul>
        </GuideStep>

        <GuideStep number={7} title="Test the integration">
          <ol className="list-decimal ml-4 space-y-2">
            <li>Log into your WordPress site and check that the loyalty widget appears</li>
            <li>Place a test WooCommerce order and confirm points are awarded</li>
            <li>Check the <strong>Customers</strong> page in this dashboard to verify</li>
            <li>Test the referral flow with a referral link</li>
            <li>Redeem points and verify the discount code works at checkout</li>
          </ol>
        </GuideStep>
      </div>

      {/* Keys reference */}
      <div className="bg-bg-card border border-border-default rounded-xl p-5 mt-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your Project Keys</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-20 shrink-0">Public Key</span>
            <code className="text-xs bg-bg-surface-raised px-2 py-1 rounded text-text-secondary font-mono break-all">{publicKey}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-20 shrink-0">Secret Key</span>
            <code className="text-xs bg-bg-surface-raised px-2 py-1 rounded text-text-secondary font-mono break-all">{secretKey}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
