import { useNavigate } from 'react-router-dom';
import { Title, Subtitle, H2, P, Code, Table, CardGrid, Card } from '@/components/Docs';

export default function DocsOverview() {
  const nav = useNavigate();

  return (
    <>
      <Title>Pionts Documentation</Title>
      <Subtitle>Add loyalty points, referrals, and rewards to any e-commerce platform in minutes.</Subtitle>

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
        <Card icon="🚀" title="Quick Start" desc="Get running in 5 minutes with the Node.js SDK." badge="5 min" onClick={() => nav('/quickstart')} />
        <Card icon="🔧" title="Custom API" desc="Full guide for any Node.js / NestJS backend." badge="SDK" onClick={() => nav('/guide/custom')} />
        <Card icon="🛍️" title="Shopify" desc="Zero-code install via Shopify App Store." badge="No code" onClick={() => nav('/guide/shopify')} />
        <Card icon="🔌" title="WooCommerce" desc="WordPress plugin + webhook setup." badge="PHP" onClick={() => nav('/guide/woocommerce')} />
      </CardGrid>

      <H2>Features</H2>
      <CardGrid>
        <Card icon="⭐" title="Points" desc="Per purchase, signup, birthday, social follow, custom actions." />
        <Card icon="🎁" title="Redemption" desc="Configurable tiers — 50 pts = €5, 100 pts = €10." />
        <Card icon="🔗" title="Referrals" desc="Multi-level referral tree with per-level rewards." />
        <Card icon="💬" title="Widget" desc="Floating chat bubble, drop-in, full CSS isolation." />
        <Card icon="🔒" title="Secure" desc="HMAC auth, scoped API keys, webhook signatures, audit log." />
        <Card icon="📊" title="Analytics" desc="Points economy, referral funnels, customer segments, CSV export." />
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
