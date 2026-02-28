import CodeBlock from '../../components/CodeBlock';

interface EndpointProps {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  body?: string;
}

function Endpoint({ method, path, description, body }: EndpointProps) {
  const color = method === 'GET' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary';
  return (
    <div className="border border-border-default rounded-lg p-4 mb-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{method}</span>
        <code className="text-sm font-mono text-text-primary">{path}</code>
      </div>
      <p className="text-sm text-text-muted ml-1">{description}</p>
      {body && (
        <div className="mt-2">
          <CodeBlock language="json" code={body} />
        </div>
      )}
    </div>
  );
}

export default function ApiReference() {
  return (
    <div>
      <h1 className="text-lg font-bold text-text-primary mb-1">API Reference</h1>
      <p className="text-sm text-text-muted mb-6">All available endpoints grouped by authentication type</p>

      <div className="bg-bg-surface border border-border-default rounded-xl p-6 space-y-8">
        {/* SDK Endpoints */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-1">Public SDK Endpoints</h2>
          <p className="text-sm text-text-muted mb-4">
            Authenticated with <code className="bg-bg-surface-raised px-1 rounded text-text-secondary">X-Project-Key: pk_live_...</code> header.
            Customer endpoints also require <code className="bg-bg-surface-raised px-1 rounded text-text-secondary">X-Customer-Email</code> and <code className="bg-bg-surface-raised px-1 rounded text-text-secondary">X-Customer-Hmac</code> headers.
          </p>

          <Endpoint method="GET" path="/api/v1/sdk/customer" description="Get customer data (balance, history, referral stats)" />
          <Endpoint method="POST" path="/api/v1/sdk/signup" description="Register or identify a customer" body={`{
  "email": "customer@example.com",
  "name": "John",
  "referral_code": "ABC123"
}`} />
          <Endpoint method="POST" path="/api/v1/sdk/redeem" description="Redeem points for a discount code" body={`{ "tier_points": 100 }`} />
          <Endpoint method="POST" path="/api/v1/sdk/award" description="Claim an action (follow, share, birthday)" body={`{ "type": "follow_tiktok" }`} />
          <Endpoint method="GET" path="/api/v1/sdk/check-ref/:code" description="Validate a referral code" />
          <Endpoint method="GET" path="/api/v1/sdk/customer/referrals" description="Get customer's referral stats, direct referrals, and downline tree" />
          <Endpoint method="GET" path="/api/v1/sdk/customer/redemptions" description="Get customer's redemption history" />
          <Endpoint method="GET" path="/api/v1/sdk/leaderboard" description="Get top 10 referrers (when leaderboard enabled)" />
          <Endpoint method="POST" path="/api/v1/sdk/auth/send-code" description="Send email verification code" body={`{ "email": "customer@example.com" }`} />
          <Endpoint method="POST" path="/api/v1/sdk/auth/verify-code" description="Verify email code and get token" body={`{
  "email": "customer@example.com",
  "code": "123456"
}`} />
        </section>

        {/* Server-to-Server Endpoints */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-1">Server-to-Server Endpoints</h2>
          <p className="text-sm text-text-muted mb-4">
            Authenticated with <code className="bg-bg-surface-raised px-1 rounded text-text-secondary">X-Secret-Key: sk_live_...</code> header.
            Called from your backend only — never expose the secret key in client-side code.
          </p>

          <Endpoint method="POST" path="/api/v1/webhooks/order" description="Process a completed order (awards purchase + referral points)" body={`{
  "order_id": "ORD-123",
  "email": "customer@example.com",
  "total": 49.99
}`} />
          <Endpoint method="POST" path="/api/v1/webhooks/refund" description="Process a refund (claws back all points from the order)" body={`{ "order_id": "ORD-123" }`} />
          <Endpoint method="POST" path="/api/v1/webhooks/customer" description="Notify of a new customer creation" body={`{
  "email": "customer@example.com",
  "name": "John Doe"
}`} />
          <Endpoint method="POST" path="/api/v1/discount/validate" description="Validate a discount code at checkout" body={`{ "code": "DISC-ABC123" }`} />
          <Endpoint method="POST" path="/api/v1/discount/mark-used" description="Mark a discount code as used after checkout" body={`{ "code": "DISC-ABC123" }`} />
        </section>

        {/* Swagger link */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-1">Interactive API Docs</h2>
          <p className="text-sm text-text-muted">
            Full Swagger/OpenAPI documentation is available at{' '}
            <code className="bg-bg-surface-raised px-1 rounded text-text-secondary">/api/docs</code> on your server.
          </p>
        </section>
      </div>
    </div>
  );
}
