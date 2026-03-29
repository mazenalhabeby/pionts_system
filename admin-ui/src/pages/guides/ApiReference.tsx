import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CodeBlock from '../../components/CodeBlock';
import { useProjectKeys } from '../../hooks/useProjectKeys';

type AuthType = 'sdk' | 'server' | 'dashboard';

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: string;
  body?: string;
  response?: string;
}

function Endpoint({ method, path, description, auth, body, response }: EndpointProps) {
  const [open, setOpen] = useState(false);
  const colors: Record<string, string> = {
    GET: 'bg-success/10 text-success',
    POST: 'bg-primary/10 text-primary',
    PUT: 'bg-warning/10 text-warning',
    DELETE: 'bg-error/10 text-error',
  };

  const hasDetails = body || response;

  return (
    <div className="border border-border-default rounded-lg overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => hasDetails && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left bg-transparent border-0 font-sans ${hasDetails ? 'cursor-pointer hover:bg-bg-surface-hover' : 'cursor-default'} transition-colors`}
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${colors[method]}`}>{method}</span>
        <code className="text-sm font-mono text-text-primary flex-1 min-w-0 truncate">{path}</code>
        {hasDetails && (
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-text-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>
      <div className="px-4 pb-3 -mt-1">
        <p className="text-xs text-text-muted">{description}</p>
        <span className="inline-block text-[10px] text-text-faint bg-bg-surface-raised px-1.5 py-0.5 rounded mt-1 font-mono">{auth}</span>
      </div>
      {open && hasDetails && (
        <div className="px-4 pb-4 space-y-3 border-t border-border-default pt-3">
          {body && (
            <div>
              <div className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Request Body</div>
              <CodeBlock language="json" code={body} />
            </div>
          )}
          {response && (
            <div>
              <div className="text-[10px] text-text-faint uppercase tracking-wider mb-1">Response</div>
              <CodeBlock language="json" code={response} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-text-primary mb-1">{title}</h2>
      <p className="text-xs text-text-muted mb-4">{subtitle}</p>
      {children}
    </section>
  );
}

export default function ApiReference() {
  const navigate = useNavigate();
  const { publicKey, hmacSecret, apiBase } = useProjectKeys();
  const [activeTab, setActiveTab] = useState<AuthType>('sdk');

  const tabs: { key: AuthType; label: string; description: string }[] = [
    { key: 'sdk', label: 'SDK / Public', description: 'Browser-safe endpoints for the widget' },
    { key: 'server', label: 'Server-to-Server', description: 'Backend-only endpoints with secret key' },
    { key: 'dashboard', label: 'Dashboard', description: 'Admin endpoints with JWT auth' },
  ];

  return (
    <div>
      {/* Back + header */}
      <button onClick={() => navigate('/guides')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4 cursor-pointer bg-transparent border-0 p-0 font-sans">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Guides
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: '#6366f1' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">API Reference</h1>
          <p className="text-sm text-text-muted">Complete endpoint reference for all Pionts APIs</p>
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-bg-card border border-border-default rounded-xl p-4 mt-5 mb-5">
        <div className="text-xs text-text-faint uppercase tracking-wider mb-2">Base URL</div>
        <code className="text-sm text-text-primary font-mono">{apiBase}</code>
      </div>

      {/* Auth summary */}
      <div className="bg-bg-card border border-border-default rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Authentication</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-success/10 text-success h-fit mt-0.5 shrink-0">SDK</span>
            <div>
              <p className="text-sm text-text-secondary">Public API key + customer identity</p>
              <code className="text-xs text-text-faint font-mono mt-1 block">X-Project-Key: {publicKey}</code>
              <code className="text-xs text-text-faint font-mono">X-Customer-Email: customer@example.com</code>
              <code className="text-xs text-text-faint font-mono">X-Customer-Hmac: &lt;HMAC-SHA256 signature&gt;</code>
            </div>
          </div>
          <div className="border-t border-border-default pt-3 flex gap-3">
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning h-fit mt-0.5 shrink-0">SERVER</span>
            <div>
              <p className="text-sm text-text-secondary">Secret API key (server-side only)</p>
              <code className="text-xs text-text-faint font-mono mt-1 block">X-Secret-Key: {hmacSecret}</code>
            </div>
          </div>
          <div className="border-t border-border-default pt-3 flex gap-3">
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary h-fit mt-0.5 shrink-0">JWT</span>
            <div>
              <p className="text-sm text-text-secondary">Bearer token for dashboard admin API</p>
              <code className="text-xs text-text-faint font-mono mt-1 block">Authorization: Bearer &lt;access_token&gt;</code>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm rounded-lg cursor-pointer border transition-colors font-sans ${
              activeTab === tab.key
                ? 'bg-primary text-white border-primary'
                : 'bg-bg-card text-text-muted border-border-default hover:text-text-secondary hover:border-text-faint'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SDK endpoints */}
      {activeTab === 'sdk' && (
        <div className="bg-bg-surface border border-border-default rounded-xl p-6">
          <Section title="Customer Data" subtitle="Read customer profile, balance, and history">
            <Endpoint method="GET" path="/api/v1/sdk/customer" description="Get the authenticated customer's profile, points balance, history, referral stats, and project settings." auth="X-Project-Key + X-Customer-Email + X-Customer-Hmac"
              response={`{
  "customer": {
    "email": "john@example.com",
    "name": "John",
    "points_balance": 120,
    "points_earned_total": 250,
    "referral_code": "XK7M2P",
    "order_count": 3,
    "tier": "Silver"
  },
  "history": [
    { "type": "purchase", "points": 10, "description": "Order #1234", "created_at": "..." }
  ],
  "settings": { ... }
}`} />
            <Endpoint method="GET" path="/api/v1/sdk/customer/referrals" description="Get the customer's referral network — direct referrals, downline stats, and earnings breakdown." auth="X-Project-Key + X-Customer-Email + X-Customer-Hmac"
              response={`{
  "referral_code": "XK7M2P",
  "direct_referrals": 5,
  "network_size": 12,
  "total_earnings": 45,
  "referrals": [
    { "name": "Jane", "email": "j***@example.com", "level": 1, "points_earned": 5 }
  ]
}`} />
            <Endpoint method="GET" path="/api/v1/sdk/customer/redemptions" description="List all redemptions (discount codes) for this customer." auth="X-Project-Key + X-Customer-Email + X-Customer-Hmac" />
          </Section>

          <Section title="Customer Actions" subtitle="Register, earn points, and redeem rewards">
            <Endpoint method="POST" path="/api/v1/sdk/signup" description="Register or identify a customer. Awards signup points on first call. Handles referral attribution if a referral code is provided." auth="X-Project-Key"
              body={`{
  "email": "customer@example.com",
  "name": "John",
  "referral_code": "XK7M2P"
}`}
              response={`{
  "customer": { "email": "customer@example.com", "points_balance": 20, "referral_code": "A9B3KL" },
  "referral_applied": true,
  "signup_points": 20
}`} />
            <Endpoint method="POST" path="/api/v1/sdk/award" description="Claim a one-time or repeatable action. Types: follow_tiktok, follow_instagram, share_product, review_photo, review_text, birthday." auth="X-Project-Key + X-Customer-Email + X-Customer-Hmac"
              body={`{ "type": "follow_tiktok" }`}
              response={`{ "points_awarded": 10, "new_balance": 130, "already_claimed": false }`} />
            <Endpoint method="POST" path="/api/v1/sdk/redeem" description="Redeem points for a discount code. The tier_points must match a configured redemption tier." auth="X-Project-Key + X-Customer-Email + X-Customer-Hmac"
              body={`{ "tier_points": 100 }`}
              response={`{
  "discount_code": "PIONTS-A3K9X2",
  "discount_amount": 5.00,
  "points_spent": 100,
  "new_balance": 30
}`} />
          </Section>

          <Section title="Utilities" subtitle="Referral validation, leaderboard, and widget auth">
            <Endpoint method="GET" path="/api/v1/sdk/check-ref/:code" description="Check if a referral code is valid. Returns the referrer's name (masked) if valid." auth="X-Project-Key"
              response={`{ "valid": true, "referrer_name": "J***n" }`} />
            <Endpoint method="GET" path="/api/v1/sdk/leaderboard" description="Get the top 10 referrers. Only available if leaderboard is enabled in project settings." auth="X-Project-Key" />
            <Endpoint method="POST" path="/api/v1/sdk/auth/send-code" description="Send a 6-digit email verification code for widget login (no HMAC needed)." auth="X-Project-Key"
              body={`{ "email": "customer@example.com" }`} />
            <Endpoint method="POST" path="/api/v1/sdk/auth/verify-code" description="Verify the email code and receive a JWT token for authenticated widget access." auth="X-Project-Key"
              body={`{ "email": "customer@example.com", "code": "123456" }`}
              response={`{ "token": "eyJhbGci...", "customer": { ... } }`} />
          </Section>
        </div>
      )}

      {/* Server endpoints */}
      {activeTab === 'server' && (
        <div className="bg-bg-surface border border-border-default rounded-xl p-6">
          <Section title="Order Processing" subtitle="Send purchase and refund events to award/claw back points">
            <Endpoint method="POST" path="/api/v1/webhooks/order" description="Process a completed order. Awards purchase points, first-order bonus, and 3-level referral chain points. Deduplicated by order_id." auth="X-Secret-Key"
              body={`{
  "order_id": "ORD-12345",
  "email": "customer@example.com",
  "total": 49.99
}`}
              response={`{
  "success": true,
  "points_awarded": {
    "purchase": 10,
    "first_order": 50,
    "referral_l2": 5,
    "referral_l3": 2
  }
}`} />
            <Endpoint method="POST" path="/api/v1/webhooks/refund" description="Process a refund. Claws back all positive point entries associated with the order (purchase, referral chain)." auth="X-Secret-Key"
              body={`{ "order_id": "ORD-12345" }`}
              response={`{ "success": true, "points_clawed_back": 67 }`} />
            <Endpoint method="POST" path="/api/v1/webhooks/customer" description="Notify of a new customer creation. Awards signup points if not already registered." auth="X-Secret-Key"
              body={`{
  "email": "customer@example.com",
  "name": "John Doe"
}`} />
          </Section>

          <Section title="Discount Codes" subtitle="Validate and mark discount codes at checkout">
            <Endpoint method="POST" path="/api/v1/discount/validate" description="Check if a discount code is valid and unused. Returns the discount amount." auth="X-Secret-Key"
              body={`{ "code": "PIONTS-A3K9X2" }`}
              response={`{
  "valid": true,
  "discount_amount": 5.00,
  "customer_email": "customer@example.com"
}`} />
            <Endpoint method="POST" path="/api/v1/discount/mark-used" description="Mark a discount code as used after successful checkout. Idempotent — safe to call multiple times." auth="X-Secret-Key"
              body={`{ "code": "PIONTS-A3K9X2" }`}
              response={`{ "success": true }`} />
          </Section>
        </div>
      )}

      {/* Dashboard endpoints */}
      {activeTab === 'dashboard' && (
        <div className="bg-bg-surface border border-border-default rounded-xl p-6">
          <Section title="Authentication" subtitle="Login, signup, and token management">
            <Endpoint method="POST" path="/auth/register" description="Create a new organization and admin user account." auth="None"
              body={`{
  "email": "admin@company.com",
  "password": "securePassword123",
  "name": "Admin User",
  "orgName": "My Company"
}`} />
            <Endpoint method="POST" path="/auth/login" description="Authenticate and receive an access token. Sets a refresh token cookie." auth="None"
              body={`{ "email": "admin@company.com", "password": "securePassword123" }`}
              response={`{ "accessToken": "eyJhbGci...", "user": { ... } }`} />
            <Endpoint method="POST" path="/auth/refresh" description="Exchange refresh token cookie for a new access token." auth="Cookie: refresh_token" />
            <Endpoint method="GET" path="/auth/me" description="Get the currently authenticated user's profile, org, and memberships." auth="Bearer token" />
          </Section>

          <Section title="Projects" subtitle="Manage projects and API keys">
            <Endpoint method="GET" path="/api/v1/projects" description="List all projects in your organization." auth="Bearer token" />
            <Endpoint method="POST" path="/api/v1/projects" description="Create a new project." auth="Bearer token"
              body={`{ "name": "My Store Rewards", "domain": "mystore.com" }`} />
            <Endpoint method="GET" path="/api/v1/projects/:id/keys" description="List API keys for a project." auth="Bearer token" />
            <Endpoint method="POST" path="/api/v1/projects/:id/keys" description="Generate a new public/secret key pair." auth="Bearer token" />
            <Endpoint method="DELETE" path="/api/v1/projects/:id/keys/:keyId" description="Revoke an API key." auth="Bearer token" />
          </Section>

          <Section title="Customer Management" subtitle="View, search, and manage customers">
            <Endpoint method="GET" path="/api/v1/projects/:id/customers" description="List customers with search, sort, pagination, and segment filtering." auth="Bearer token" />
            <Endpoint method="GET" path="/api/v1/projects/:id/customers/:custId" description="Get full customer profile including history, referral chain, and stats." auth="Bearer token" />
            <Endpoint method="POST" path="/api/v1/projects/:id/customers/:custId/award" description="Manually award points to a customer." auth="Bearer token"
              body={`{ "points": 50, "reason": "Customer appreciation bonus" }`} />
            <Endpoint method="POST" path="/api/v1/projects/:id/customers/:custId/deduct" description="Manually deduct points from a customer." auth="Bearer token"
              body={`{ "points": 20, "reason": "Correction" }`} />
          </Section>

          <Section title="Analytics" subtitle="Points economy, referral funnel, and exports">
            <Endpoint method="GET" path="/api/v1/projects/:id/analytics/points-economy" description="Points issued vs redeemed over time (chart data)." auth="Bearer token" />
            <Endpoint method="GET" path="/api/v1/projects/:id/analytics/referral-funnel" description="Referral link clicks → signups → first purchases funnel." auth="Bearer token" />
            <Endpoint method="GET" path="/api/v1/projects/:id/analytics/segments" description="Customer segments: active, at-risk, churned." auth="Bearer token" />
            <Endpoint method="GET" path="/api/v1/projects/:id/analytics/export/customers" description="Export all customers as CSV." auth="Bearer token" />
            <Endpoint method="GET" path="/api/v1/projects/:id/analytics/export/points" description="Export full points log as CSV." auth="Bearer token" />
          </Section>
        </div>
      )}
    </div>
  );
}
