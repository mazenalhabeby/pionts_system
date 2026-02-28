import { useProject } from '../../context/ProjectContext';
import CodeBlock from '../../components/CodeBlock';
import GuideStep from '../../components/GuideStep';

export default function ShopifyGuide() {
  const { currentProject } = useProject();
  const pk = 'pk_live_YOUR_KEY'; // placeholder

  return (
    <div>
      <h1 className="text-lg font-bold text-text-primary mb-1">Shopify Integration</h1>
      <p className="text-sm text-text-muted mb-6">Add Pionts loyalty rewards to your Shopify store</p>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6">
        <GuideStep number={1} title="Get your API keys">
          <p>Go to the <strong>API Keys</strong> page and copy your public key (<code>pk_live_...</code>) and secret key (<code>sk_live_...</code>).</p>
        </GuideStep>

        <GuideStep number={2} title="Add the SDK to your theme">
          <p>In your Shopify admin, go to <strong>Online Store → Themes → Edit code</strong>. Open <code>theme.liquid</code> and paste before <code>{'</body>'}</code>:</p>
          <CodeBlock language="liquid" code={`{% if customer %}
<script src="https://your-server.com/sdk/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: '${pk}',
    customer: {
      email: '{{ customer.email }}',
      name: '{{ customer.first_name }}',
      hmac: '{{ customer.email | hmac_sha256: "sk_live_YOUR_SECRET_KEY" }}'
    }
  });
</script>
{% endif %}`} />
        </GuideStep>

        <GuideStep number={3} title="Set up order webhooks">
          <p>In Shopify admin, go to <strong>Settings → Notifications → Webhooks</strong>. Add:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li><strong>Order payment</strong> → <code>https://your-server.com/api/v1/webhooks/order</code></li>
            <li><strong>Refund created</strong> → <code>https://your-server.com/api/v1/webhooks/refund</code></li>
          </ul>
          <p className="mt-2">Set the header <code>X-Secret-Key</code> with your secret key.</p>
        </GuideStep>

        <GuideStep number={4} title="Configure your project">
          <p>In the <strong>Settings</strong> page, set your referral base URL to your Shopify store domain (e.g., <code>https://mystore.myshopify.com</code>) and configure point values.</p>
        </GuideStep>
      </div>
    </div>
  );
}
