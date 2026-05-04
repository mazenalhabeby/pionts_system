import { useNavigate } from 'react-router-dom';
import { DocsTitle, DocsSubtitle, H2, P, Code, Table, CardGrid, Card } from './DocsComponents';

export default function DocsOverview() {
  const nav = useNavigate();

  return (
    <>
      <DocsTitle>Pionts Documentation</DocsTitle>
      <DocsSubtitle>Add loyalty points, referrals, and rewards to any e-commerce platform in minutes.</DocsSubtitle>

      <H2>How It Works</H2>
      <P>Pionts connects to your shop via a simple API. Your backend makes 4 calls, your frontend loads a widget — customers start earning and redeeming points immediately.</P>

      <Code lang="architecture">{`┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Customer   │────────▶│  Your Shop   │────────▶│    Pionts    │
│   Browser    │         │   Backend    │         │    Server    │
└──────┬───────┘         └──────────────┘         └──────────────┘
       │                                                  ▲
       │   Floating Widget                                │
       └──────────────────────────────────────────────────┘`}</Code>

      <Table
        headers={['Flow', 'Description']}
        rows={[
          ['Shop → Pionts', 'Checkout validate, mark-used, order paid, refunded'],
          ['Widget → Pionts', 'Customer data, redemption, referrals, history'],
          ['Pionts → Shop', 'Webhook events (optional)'],
        ]}
      />

      <H2>Choose Your Platform</H2>
      <CardGrid>
        <Card icon="🚀" title="Quick Start" desc="Get running in 5 minutes with the Node.js SDK." onClick={() => nav('/docs/quickstart')} />
        <Card icon="🔧" title="Custom API" desc="Full guide for any Node.js backend." onClick={() => nav('/docs/guide/custom')} />
        <Card icon="🛍️" title="Shopify" desc="Zero-code install via App Store." onClick={() => nav('/docs/guide/shopify')} />
        <Card icon="🔌" title="WooCommerce" desc="WordPress plugin + webhooks." onClick={() => nav('/docs/guide/woocommerce')} />
      </CardGrid>

      <H2>Features</H2>
      <CardGrid>
        <Card icon="⭐" title="Points" desc="Per purchase, signup, birthday, social follow, custom actions." />
        <Card icon="🎁" title="Redemption" desc="Configurable tiers — 50 pts = €5, 100 pts = €10." />
        <Card icon="🔗" title="Referrals" desc="Multi-level referral tree with per-level rewards." />
        <Card icon="💬" title="Widget" desc="Floating chat bubble, drop-in, CSS isolated." />
        <Card icon="🔒" title="Secure" desc="HMAC auth, scoped API keys, webhook signatures." />
        <Card icon="📊" title="Analytics" desc="Points economy, referral funnels, segments, export." />
      </CardGrid>

      <H2>Environment Variables</H2>
      <Table
        headers={['Variable', 'Required', 'Description']}
        rows={[
          ['PIONTS_API_URL', 'Yes', 'Pionts server URL'],
          ['PIONTS_SECRET_KEY', 'Yes', 'Secret key sk_live_...'],
          ['PIONTS_PROJECT_KEY', 'Widget only', 'Public key pk_live_...'],
          ['PIONTS_HMAC_SECRET', 'Widget only', 'HMAC secret for customer auth'],
        ]}
      />
    </>
  );
}
