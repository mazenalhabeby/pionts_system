import CodeBlock from '../../components/CodeBlock';
import GuideStep from '../../components/GuideStep';

export default function WordPressGuide() {
  const pk = 'pk_live_YOUR_KEY';

  return (
    <div>
      <h1 className="text-lg font-bold text-text-primary mb-1">WordPress / WooCommerce</h1>
      <p className="text-sm text-text-muted mb-6">Add Pionts loyalty rewards to your WordPress or WooCommerce site</p>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6">
        <GuideStep number={1} title="Add the SDK snippet">
          <p>In your WordPress admin, go to <strong>Appearance → Theme File Editor</strong>. Open <code>footer.php</code> and paste before <code>{'</body>'}</code>:</p>
          <CodeBlock language="php" code={`<?php if (is_user_logged_in()): $u = wp_get_current_user(); ?>
<script src="https://your-server.com/sdk/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: '${pk}',
    customer: {
      email: '<?= esc_attr($u->user_email) ?>',
      name: '<?= esc_attr($u->first_name) ?>',
      hmac: '<?= hash_hmac("sha256", $u->user_email, "sk_live_YOUR_SECRET_KEY") ?>'
    }
  });
</script>
<?php endif; ?>`} />
        </GuideStep>

        <GuideStep number={2} title="Set up WooCommerce webhooks">
          <p>In WooCommerce, go to <strong>Settings → Advanced → Webhooks</strong>. Add:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Order completed</strong> → <code>https://your-server.com/api/v1/webhooks/order</code></li>
            <li><strong>Order refunded</strong> → <code>https://your-server.com/api/v1/webhooks/refund</code></li>
          </ul>
          <p className="mt-2">Include the <code>X-Secret-Key</code> header with your secret key.</p>
        </GuideStep>

        <GuideStep number={3} title="Configure your project">
          <p>Set your referral base URL and point values in the <strong>Settings</strong> page.</p>
        </GuideStep>
      </div>
    </div>
  );
}
