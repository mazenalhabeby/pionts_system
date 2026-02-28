import CodeBlock from '../../components/CodeBlock';
import GuideStep from '../../components/GuideStep';

export default function CustomGuide() {
  const pk = 'pk_live_YOUR_KEY';

  return (
    <div>
      <h1 className="text-lg font-bold text-text-primary mb-1">Custom Website</h1>
      <p className="text-sm text-text-muted mb-6">Add Pionts loyalty rewards to any website with a server backend</p>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6">
        <GuideStep number={1} title="Generate the HMAC on your server">
          <p>Your backend must sign the customer's email with your secret key. This prevents spoofing.</p>
          <CodeBlock language="node.js" code={`const crypto = require('crypto');

function generateHmac(email, secretKey) {
  return crypto
    .createHmac('sha256', secretKey)
    .update(email)
    .digest('hex');
}

// Pass this to your frontend template
const hmac = generateHmac(user.email, 'sk_live_YOUR_SECRET_KEY');`} />
          <p className="mt-2">Or in Python:</p>
          <CodeBlock language="python" code={`import hmac, hashlib

def generate_hmac(email: str, secret_key: str) -> str:
    return hmac.new(
        secret_key.encode(), email.encode(), hashlib.sha256
    ).hexdigest()`} />
        </GuideStep>

        <GuideStep number={2} title="Add the SDK to your page">
          <p>Include the script and initialize with customer data. Place before <code>{'</body>'}</code>:</p>
          <CodeBlock language="html" code={`<script src="https://your-server.com/sdk/loyalty.js"></script>
<script>
  Loyalty.init({
    projectKey: '${pk}',
    customer: {
      email: 'USER_EMAIL',
      name: 'USER_NAME',
      hmac: 'GENERATED_HMAC'
    }
  });
</script>`} />
          <p className="mt-2">Replace <code>USER_EMAIL</code>, <code>USER_NAME</code>, and <code>GENERATED_HMAC</code> with values from your backend.</p>
        </GuideStep>

        <GuideStep number={3} title="Send order webhooks">
          <p>When a customer completes a purchase, send a POST request from your server:</p>
          <CodeBlock language="bash" code={`curl -X POST https://your-server.com/api/v1/webhooks/order \\
  -H "Content-Type: application/json" \\
  -H "X-Secret-Key: sk_live_YOUR_SECRET_KEY" \\
  -d '{
    "order_id": "ORD-123",
    "email": "customer@example.com",
    "total": 49.99
  }'`} />
          <p className="mt-2">For refunds:</p>
          <CodeBlock language="bash" code={`curl -X POST https://your-server.com/api/v1/webhooks/refund \\
  -H "Content-Type: application/json" \\
  -H "X-Secret-Key: sk_live_YOUR_SECRET_KEY" \\
  -d '{ "order_id": "ORD-123" }'`} />
        </GuideStep>

        <GuideStep number={4} title="Configure your project">
          <p>Set your referral base URL and point values in the <strong>Settings</strong> page.</p>
        </GuideStep>
      </div>
    </div>
  );
}
