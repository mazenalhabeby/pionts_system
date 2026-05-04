import { DocsTitle, DocsSubtitle, H2, P, Step, Code, Alert } from './DocsComponents';

export default function DocsQuickStart() {
  return (
    <>
      <DocsTitle>Quick Start</DocsTitle>
      <DocsSubtitle>Get Pionts running in your shop in 5 minutes.</DocsSubtitle>

      <H2>Prerequisites</H2>
      <P>A Pionts project with API keys (from the dashboard) and Node.js 18+.</P>

      <Step num={1} title="Install">
        <Code lang="bash">npm install @pionts/sdk</Code>
      </Step>

      <Step num={2} title="Initialize">
        <Code lang="typescript">{`import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL,
  secretKey: process.env.PIONTS_SECRET_KEY,
});`}</Code>
      </Step>

      <Step num={3} title="Validate at Checkout">
        <Code lang="typescript">{`const result = await pionts.checkout.validate(code);
if (result.valid) {
  // Apply discount of result.discountAmount
}`}</Code>
      </Step>

      <Step num={4} title="Award Points After Payment">
        <Code lang="typescript">{`await pionts.orders.paid({
  orderId: order.id,
  email: customer.email,
  orderTotal: order.total,
  currency: 'EUR',
});

// If loyalty code was used:
await pionts.checkout.markUsed(code);`}</Code>
      </Step>

      <Step num={5} title="Handle Refunds">
        <Code lang="typescript">{`await pionts.orders.refunded(orderId, refundAmount);`}</Code>
      </Step>

      <Alert type="success">Done! Your shop now has loyalty points. See the Widget Setup guide to add the frontend widget.</Alert>
    </>
  );
}
