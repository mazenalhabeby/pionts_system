import { Title, Subtitle, H2, H3, P, Code, Alert, Table, Endpoint } from '@/components/Docs';

const BASE = 'Base URL: https://your-pionts-server.com/api/v2 · Auth: X-Api-Key: sk_live_...';

export function ApiCheckout() {
  return (
    <>
      <Title>API — Checkout</Title>
      <Subtitle>Validate and manage loyalty discount codes at checkout.</Subtitle>
      <P>{BASE}</P>

      <Endpoint method="POST" path="/checkout/validate" desc="Validate a loyalty discount code">
        <H3>Request</H3>
        <Code lang="json">{`{ "code": "8bc-abc123-xyz" }`}</Code>
        <H3>Response (valid)</H3>
        <Code lang="json">{`{ "valid": true, "discountAmount": 5, "alreadyUsed": false }`}</Code>
        <H3>Response (invalid)</H3>
        <Code lang="json">{`{ "valid": false }`}</Code>
        <P>Scope required: checkout or full</P>
      </Endpoint>

      <Endpoint method="POST" path="/checkout/mark-used" desc="Mark code as used after payment">
        <H3>Request</H3>
        <Code lang="json">{`{ "code": "8bc-abc123-xyz", "orderId": "ORD-001" }`}</Code>
        <H3>Response</H3>
        <Code lang="json">{`{ "success": true }`}</Code>
        <Alert type="warning">Always call mark-used after payment. Without it, customers can refund the code and get points back while keeping the discount.</Alert>
      </Endpoint>
    </>
  );
}

export function ApiOrders() {
  return (
    <>
      <Title>API — Orders</Title>
      <Subtitle>Notify Pionts about order events to award or reverse points.</Subtitle>
      <P>{BASE}</P>

      <Endpoint method="POST" path="/orders/paid" desc="Award points for a paid order">
        <H3>Request</H3>
        <Code lang="json">{`{
  "orderId": "ORD-001",
  "email": "customer@example.com",
  "customerName": "John Doe",
  "orderTotal": 99.99,
  "currency": "EUR",
  "referralCode": "abc123"
}`}</Code>
        <H3>Response</H3>
        <Code lang="json">{`{ "status": "processed", "points_awarded": 99 }`}</Code>
        <P>Idempotent — duplicate orderId calls are safely ignored.</P>
      </Endpoint>

      <Endpoint method="POST" path="/orders/refunded" desc="Reverse points for a refunded order">
        <H3>Request</H3>
        <Code lang="json">{`{ "orderId": "ORD-001", "refundAmount": 49.99 }`}</Code>
      </Endpoint>
    </>
  );
}

export function ApiCustomers() {
  return (
    <>
      <Title>API — Customers</Title>
      <Subtitle>Read customer data, redeem points, and manage redemptions.</Subtitle>
      <P>{BASE}</P>

      <Endpoint method="GET" path="/customers/:email" desc="Get balance, history, profile">
        <Code lang="json">{`{
  "found": true,
  "points_balance": 145,
  "points_earned_total": 245,
  "referral_code": "btymnq",
  "history": [{ "points": 50, "type": "earn", "description": "Purchase" }],
  "redemptions": [{ "id": 1, "discount_code": "8bc-xyz", "discount_amount": 5, "used": false }]
}`}</Code>
      </Endpoint>

      <Endpoint method="POST" path="/customers/:email/redeem" desc="Redeem points for a discount code">
        <H3>Request</H3>
        <Code lang="json">{`{ "points": 100 }`}</Code>
        <H3>Response</H3>
        <Code lang="json">{`{ "discount_code": "8bc-btymnq-abc123", "discount_amount": 10, "new_balance": 45 }`}</Code>
      </Endpoint>

      <Endpoint method="DELETE" path="/customers/:email/redemptions/:id" desc="Cancel a redemption">
        <Code lang="json">{`{ "points_returned": 100, "new_balance": 145 }`}</Code>
        <Alert type="warning">Fails if code is on a pending order or already used.</Alert>
      </Endpoint>
    </>
  );
}

export function ApiConfig() {
  return (
    <>
      <Title>API — Config & Widget</Title>
      <Subtitle>Project configuration and widget initialization.</Subtitle>
      <P>{BASE}</P>

      <Endpoint method="GET" path="/config" desc="Get earn actions, tiers, settings">
        <P>Returns the full project configuration. Cached for 5 minutes.</P>
      </Endpoint>

      <Endpoint method="POST" path="/widget/init" desc="Generate HMAC for widget auth">
        <H3>Request</H3>
        <Code lang="json">{`{ "email": "user@example.com", "name": "John" }`}</Code>
        <H3>Response</H3>
        <Code lang="json">{`{
  "projectKey": "pk_live_...",
  "hmac": "a1b2c3d4...",
  "apiBase": "https://pionts.example.com",
  "email": "user@example.com",
  "name": "John"
}`}</Code>
      </Endpoint>
    </>
  );
}

export function ApiWebhooks() {
  return (
    <>
      <Title>API — Webhooks</Title>
      <Subtitle>Register endpoints for real-time event notifications.</Subtitle>
      <P>{BASE}</P>

      <H2>Endpoints</H2>
      <Table headers={['Method', 'Path', 'Description']} rows={[
        ['POST', '/webhooks', 'Register a webhook endpoint'],
        ['GET', '/webhooks', 'List registered webhooks'],
        ['DELETE', '/webhooks/:id', 'Remove a webhook'],
        ['GET', '/webhooks/:id/logs', 'View delivery history'],
        ['POST', '/webhooks/:id/test', 'Send a test event'],
      ]} />

      <H2>Available Events</H2>
      <Table headers={['Event', 'When']} rows={[
        ['redemption.created', 'Customer redeems points'],
        ['redemption.cancelled', 'Customer cancels redemption'],
        ['redemption.used', 'Code marked as used'],
        ['order.points_awarded', 'Points awarded for order'],
        ['customer.created', 'New customer registered'],
      ]} />

      <H2>Delivery Headers</H2>
      <Table headers={['Header', 'Description']} rows={[
        ['X-Pionts-Signature', 'sha256=<hmac> — HMAC-SHA256 of body'],
        ['X-Pionts-Event-Id', 'Unique event ID (idempotency)'],
        ['X-Pionts-Event-Type', 'Event name'],
      ]} />

      <H2>Verify Signatures</H2>
      <Code lang="typescript">{`import { PiontsWebhook } from '@pionts/sdk';
const isValid = PiontsWebhook.verify(rawBody, signature, endpointSecret);`}</Code>

      <P>Retry policy: 3 attempts with exponential backoff (10s → 60s → 300s).</P>
    </>
  );
}
