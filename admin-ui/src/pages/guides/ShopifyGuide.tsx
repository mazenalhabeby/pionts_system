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

function CheckItem({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className={`mt-0.5 shrink-0 ${done ? 'text-success' : 'text-text-faint'}`}>
        {done ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
        )}
      </span>
      <span className="text-sm text-text-secondary">{children}</span>
    </div>
  );
}

export default function ShopifyGuide() {
  const navigate = useNavigate();
  const { publicKey, secretKey, apiBase } = useProjectKeys();

  return (
    <div>
      {/* Back + header */}
      <button onClick={() => navigate('/guides')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer bg-transparent border-0 p-0 font-sans">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Guides
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: '#95bf47' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Shopify Integration</h1>
          <p className="text-sm text-text-muted">One-click install with automatic setup</p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-bg-card border border-border-default rounded-xl p-5 mt-5 mb-5">
        <h2 className="text-sm font-semibold text-text-primary mb-2">What you get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <CheckItem done>Automatic organization &amp; project creation</CheckItem>
          <CheckItem done>API keys generated automatically</CheckItem>
          <CheckItem done>Order &amp; refund webhooks registered</CheckItem>
          <CheckItem done>Rewards page in customer account area</CheckItem>
          <CheckItem done>Referral link tracking with cookies</CheckItem>
          <CheckItem done>Discount code generation at checkout</CheckItem>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-6">
        <GuideStep number={1} title="Install the Pionts Shopify App">
          <p>Visit the install URL for your Pionts server to start the OAuth flow. This creates your organization, project, and API keys automatically.</p>
          <CodeBlock language="url" code={`${apiBase}/shopify/auth?shop=YOUR-STORE.myshopify.com`} />
          <p>Replace <code>YOUR-STORE</code> with your actual Shopify store subdomain. You'll be redirected to Shopify to approve the following permissions:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2">
            <li><strong>Read customers</strong> — to identify customers in the rewards widget</li>
            <li><strong>Read orders</strong> — to award points on purchases</li>
            <li><strong>Write discounts</strong> — to create discount codes when customers redeem points</li>
          </ul>
          <InfoBox>
            After approval, you'll be automatically logged into the Pionts dashboard — no separate signup needed.
          </InfoBox>
        </GuideStep>

        <GuideStep number={2} title="What happens automatically">
          <p>When you install the app, the following is set up for you behind the scenes:</p>
          <div className="bg-bg-surface-raised rounded-lg p-4 mt-2 space-y-3 text-sm font-mono">
            <div className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              <span className="text-text-secondary">Organization created from your store name</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              <span className="text-text-secondary">Project created with &quot;{'{store}'} Rewards&quot; name</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              <span className="text-text-secondary">Public key (<code>pk_live_...</code>) &amp; secret key (<code>sk_live_...</code>) generated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              <span className="text-text-secondary">Webhooks registered: <code>orders/create</code>, <code>refunds/create</code>, <code>app/uninstalled</code></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              <span className="text-text-secondary">Shop metafields set for the Customer Account extension</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success">&#10003;</span>
              <span className="text-text-secondary">Dashboard user account created from your Shopify email</span>
            </div>
          </div>
        </GuideStep>

        <GuideStep number={3} title="Customer Account Rewards Page">
          <p>The Pionts Shopify app includes a <strong>Customer Account UI extension</strong> that adds a &quot;Rewards&quot; page directly in your store's customer account area. Customers can:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2">
            <li>View their points balance and tier progress</li>
            <li>Copy and share their referral link</li>
            <li>Redeem points for discount codes</li>
            <li>See their full points history</li>
            <li>Complete earn actions (social follows, etc.)</li>
          </ul>
          <p className="mt-3">The extension auto-configures itself — it reads your project&apos;s API keys from the backend so merchants don&apos;t need to enter any settings manually.</p>
          <InfoBox>
            The extension appears as a new page in the customer account navigation. Customers find it at <code>/account/pages/rewards</code>.
          </InfoBox>
        </GuideStep>

        <GuideStep number={4} title="Deploy the extension">
          <p>If you&apos;re developing the Shopify app locally, deploy the extension to make it live:</p>
          <CodeBlock language="bash" code={`cd shopify-app
npx shopify app deploy --force`} />
          <p className="mt-2">This publishes the Customer Account extension to your store. After deployment, customers will see the Rewards page when they log into their account.</p>
        </GuideStep>

        <GuideStep number={5} title="Optional: Floating widget via theme code">
          <p>If you also want the floating loyalty widget on your storefront (in addition to the customer account page), add this to your <code>theme.liquid</code> before <code>{'</body>'}</code>:</p>
          <CodeBlock language="liquid" code={`{% if customer %}
<script src="${apiBase}/sdk/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: '${publicKey}',
    customer: {
      email: '{{ customer.email }}',
      name: '{{ customer.first_name }}',
      hmac: '{{ customer.email | hmac_sha256: "${secretKey}" }}'
    }
  });
</script>
{% endif %}`} />
          <InfoBox>
            The floating widget and customer account page can run side by side — they share the same customer data and points balance.
          </InfoBox>
        </GuideStep>

        <GuideStep number={6} title="Configure your project">
          <p>Head to the <strong>Settings</strong> page in this dashboard to customize:</p>
          <ul className="list-disc ml-4 space-y-1 mt-2">
            <li><strong>Points values</strong> — how many points per action (signup, purchase, review, etc.)</li>
            <li><strong>Redemption tiers</strong> — what discounts customers can redeem (50 pts = $2, 100 pts = $5, etc.)</li>
            <li><strong>Referral settings</strong> — 3-level referral chain rewards and minimum order amounts</li>
            <li><strong>Widget appearance</strong> — colors, logo, and social media links</li>
            <li><strong>Referral base URL</strong> — set to your store domain for referral links</li>
          </ul>
        </GuideStep>

        <GuideStep number={7} title="Test the integration">
          <p>To verify everything is working:</p>
          <ol className="list-decimal ml-4 space-y-2 mt-2">
            <li>Log into your store as a customer and check the <strong>Rewards</strong> page in your account</li>
            <li>Place a test order — you should see purchase points awarded within seconds</li>
            <li>Check the <strong>Customers</strong> page in this dashboard to confirm the points log</li>
            <li>Try the referral flow: share a referral link, sign up a new customer via that link, and place an order</li>
            <li>Redeem points on the Rewards page and verify a discount code is generated</li>
          </ol>
          <InfoBox>
            Webhook events (orders, refunds) are processed in real-time. If points don't appear, check the <strong>Overview</strong> page for recent activity or verify your webhooks in the Shopify app settings.
          </InfoBox>
        </GuideStep>
      </div>

      {/* Your keys reference */}
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-20 shrink-0">API Base</span>
            <code className="text-xs bg-bg-surface-raised px-2 py-1 rounded text-text-secondary font-mono break-all">{apiBase}</code>
          </div>
        </div>
        <p className="text-xs text-text-faint mt-3">These are auto-populated from your current project. You can manage keys on the <button onClick={() => navigate('/api-keys')} className="text-primary hover:underline bg-transparent border-0 p-0 font-sans text-xs cursor-pointer">API Keys</button> page.</p>
      </div>
    </div>
  );
}
