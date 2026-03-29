import { useState, useEffect, useCallback } from 'react';
import {
  reactExtension,
  useApi,
  useSettings,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Heading,
  Button,
  Badge,
  Divider,
  Grid,
  View,
  TextField,
  SkeletonText,
} from '@shopify/ui-extensions-react/customer-account';

/* ------------------------------------------------------------------ */
/*  HMAC-SHA256 via Web Crypto (available in extension sandbox)       */
/* ------------------------------------------------------------------ */
async function hmacSha256(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function pointsLabel(pts) {
  const abs = Math.abs(pts);
  return `${pts >= 0 ? '+' : ''}${pts} pt${abs !== 1 ? 's' : ''}`;
}

const TYPE_LABELS = {
  signup: 'Sign-up bonus',
  purchase: 'Purchase',
  first_order: 'First order bonus',
  referral_l2: 'Referral reward',
  referral_l3: 'Network reward',
  review_photo: 'Photo review',
  review_text: 'Text review',
  follow_tiktok: 'Followed TikTok',
  follow_instagram: 'Followed Instagram',
  share_product: 'Product share',
  birthday: 'Birthday bonus',
  redeem: 'Redeemed',
  clawback: 'Clawback',
  manual_award: 'Bonus',
  manual_deduct: 'Deduction',
};

/* ------------------------------------------------------------------ */
/*  Extension registration                                            */
/* ------------------------------------------------------------------ */
export default reactExtension('customer-account.page.render', () => (
  <RewardsPage />
));

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
function RewardsPage() {
  const { query, sessionToken } = useApi();
  const settings = useSettings();

  const projectKey = settings.project_key || '';
  const apiBase = (settings.api_base || '').replace(/\/+$/, '');
  const secretKey = settings.secret_key || '';

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [shopifyId, setShopifyId] = useState(null);
  const [redeemingTier, setRedeemingTier] = useState(null);
  const [lastCode, setLastCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [claimingAction, setClaimingAction] = useState(null);

  /* ---- Extract Shopify customer ID from session token ---- */
  const getShopifyCustomerId = useCallback(async () => {
    if (!sessionToken) return null;
    try {
      const token = await sessionToken.get();
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      return (payload.sub || '').split('/').pop() || null;
    } catch { return null; }
  }, [sessionToken]);

  /* ---- Fetch customer email (GraphQL → identify endpoint fallback) ---- */
  const fetchCustomerEmail = useCallback(async () => {
    // Strategy 1: GraphQL Customer Account API
    try {
      const result = await query(
        `query { customer { id emailAddress { emailAddress } firstName lastName } }`,
      );
      const c = result?.data?.customer;
      const email = c?.emailAddress?.emailAddress;
      if (email) return { email, name: c?.firstName || '' };
    } catch { /* GraphQL may not work without Protected Customer Data approval */ }

    // Strategy 2: Identify by Shopify customer ID via backend
    if (apiBase && projectKey) {
      const custId = await getShopifyCustomerId();
      if (custId) {
        setShopifyId(custId);
        try {
          const res = await fetch(`${apiBase}/api/v1/sdk/shopify/identify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Project-Key': projectKey },
            body: JSON.stringify({ shopify_customer_id: custId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.found && data.email) return { email: data.email, name: data.name || '' };
            if (data.needs_email) return { email: '', name: '', needs_email: true };
          }
        } catch { /* silent */ }
      }
    }

    return { email: '', name: '' };
  }, [query, sessionToken, apiBase, projectKey, getShopifyCustomerId]);

  /* ---- Fetch Pionts data ---- */
  const fetchPiontsData = useCallback(
    async (email) => {
      if (!apiBase || !projectKey || !email) return null;
      const hmac = await hmacSha256(secretKey, email);
      const res = await fetch(`${apiBase}/api/v1/sdk/customer`, {
        headers: {
          'X-Project-Key': projectKey,
          'X-Customer-Email': email,
          'X-Customer-HMAC': hmac,
        },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json();
    },
    [apiBase, projectKey, secretKey],
  );

  /* ---- Load data on mount ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const result = await fetchCustomerEmail();
        if (result.needs_email) {
          setNeedsEmail(true);
          setLoading(false);
          return;
        }
        if (!result.email) {
          setError('Could not retrieve your email. Please make sure you are logged in.');
          setLoading(false);
          return;
        }
        const data = await fetchPiontsData(result.email);
        if (!cancelled) {
          setCustomer(data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load rewards');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [fetchCustomerEmail, fetchPiontsData]);

  /* ---- Refresh helper ---- */
  const refresh = useCallback(async () => {
    try {
      const { email } = await fetchCustomerEmail();
      if (email) {
        const data = await fetchPiontsData(email);
        setCustomer(data);
      }
    } catch { /* silent */ }
  }, [fetchCustomerEmail, fetchPiontsData]);

  /* ---- Submit email for new Shopify customers ---- */
  const submitEmail = useCallback(async () => {
    if (!emailInput || !shopifyId || !apiBase || !projectKey) return;
    setLoading(true);
    setNeedsEmail(false);
    try {
      const res = await fetch(`${apiBase}/api/v1/sdk/shopify/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Project-Key': projectKey },
        body: JSON.stringify({ shopify_customer_id: shopifyId, email: emailInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to register');
      const data = await res.json();
      if (data.email) {
        const customerData = await fetchPiontsData(data.email);
        setCustomer(customerData);
      }
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [emailInput, shopifyId, apiBase, projectKey, fetchPiontsData]);

  /* ---- Redeem handler ---- */
  const handleRedeem = useCallback(
    async (tierPoints) => {
      if (!customer) return;
      setRedeemingTier(tierPoints);
      try {
        const hmac = await hmacSha256(secretKey, customer.email);
        const res = await fetch(`${apiBase}/api/v1/sdk/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': projectKey,
            'X-Customer-Email': customer.email,
            'X-Customer-HMAC': hmac,
          },
          body: JSON.stringify({ tier_points: tierPoints }),
        });
        if (!res.ok) throw new Error('Redemption failed');
        const result = await res.json();
        setLastCode(result.discount_code);
        await refresh();
      } catch (e) {
        setError(e.message);
      } finally {
        setRedeemingTier(null);
      }
    },
    [customer, apiBase, projectKey, secretKey, refresh],
  );

  /* ---- Claim action handler ---- */
  const handleClaim = useCallback(
    async (slug) => {
      if (!customer) return;
      setClaimingAction(slug);
      try {
        const hmac = await hmacSha256(secretKey, customer.email);
        const headers = {
          'Content-Type': 'application/json',
          'X-Project-Key': projectKey,
          'X-Customer-Email': customer.email,
          'X-Customer-HMAC': hmac,
        };
        // For social follows, initiate first
        if (slug.startsWith('follow_')) {
          await fetch(`${apiBase}/api/v1/sdk/social/initiate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ type: slug }),
          });
          // Open social URL in new window
          const action = customer.earn_actions?.find((a) => a.slug === slug);
          if (action?.social_url) {
            // Can't open windows from extension — just claim after delay
          }
        }
        const res = await fetch(`${apiBase}/api/v1/sdk/award`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ type: slug }),
        });
        if (!res.ok) throw new Error('Claim failed');
        await refresh();
      } catch { /* silent */ } finally {
        setClaimingAction(null);
      }
    },
    [customer, apiBase, projectKey, secretKey, refresh],
  );

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  if (!projectKey || !apiBase) {
    return (
      <Card padding="base">
        <BlockStack spacing="base">
          <Heading>Rewards</Heading>
          <Text>Rewards are not configured yet. Please contact the store owner.</Text>
        </BlockStack>
      </Card>
    );
  }

  if (needsEmail) {
    return (
      <Card padding="base">
        <BlockStack spacing="base">
          <Heading>Join Our Rewards Program</Heading>
          <Text appearance="subdued">
            Enter your email to start earning points on every purchase.
          </Text>
          <TextField
            label="Email address"
            type="email"
            value={emailInput}
            onChange={setEmailInput}
          />
          <Button
            kind="primary"
            disabled={!emailInput || !emailInput.includes('@')}
            onPress={submitEmail}
          >
            Get Started
          </Button>
        </BlockStack>
      </Card>
    );
  }

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <Card padding="base">
        <BlockStack spacing="base">
          <Heading>Rewards</Heading>
          <Text appearance="critical">{error}</Text>
          <Button onPress={() => { setError(null); setLoading(true); refresh().then(() => setLoading(false)); }}>
            Try again
          </Button>
        </BlockStack>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card padding="base">
        <BlockStack spacing="base">
          <Heading>Rewards</Heading>
          <Text>Unable to load your rewards. Please try again later.</Text>
        </BlockStack>
      </Card>
    );
  }

  const {
    points_balance = 0,
    points_earned_total = 0,
    order_count = 0,
    referral_code = '',
    referral_stats = {},
    referral_earnings = 0,
    redemption_tiers = [],
    earn_actions = [],
    completed_actions = [],
    history = [],
    settings: projSettings = {},
  } = customer;

  const referralLink = projSettings.referral_base_url
    ? `${projSettings.referral_base_url}?ref=${referral_code}`
    : `?ref=${referral_code}`;

  // Gamification tier progress
  const tiers = projSettings.gamification_tiers || [];
  const currentTier = tiers
    .filter((t) => points_earned_total >= (t.min_points || 0))
    .sort((a, b) => (b.min_points || 0) - (a.min_points || 0))[0];
  const nextTier = tiers
    .filter((t) => (t.min_points || 0) > points_earned_total)
    .sort((a, b) => (a.min_points || 0) - (b.min_points || 0))[0];

  return (
    <BlockStack spacing="loose">
      {/* -------- Points Balance Header -------- */}
      <Card padding="base">
        <BlockStack spacing="base">
          <InlineStack spacing="tight" blockAlignment="center">
            <Heading>Your Rewards</Heading>
            {currentTier && (
              <Badge tone="info">{currentTier.name || 'Member'}</Badge>
            )}
          </InlineStack>

          <BlockStack spacing="extraTight">
            <Text size="large" emphasis="bold">
              {points_balance.toLocaleString()} points
            </Text>
            <Text appearance="subdued" size="small">
              {points_earned_total.toLocaleString()} total earned · {order_count} order{order_count !== 1 ? 's' : ''}
            </Text>
          </BlockStack>

          {nextTier && (
            <BlockStack spacing="extraTight">
              <InlineStack spacing="tight" blockAlignment="center">
                <Text size="small" appearance="subdued">
                  {nextTier.min_points - points_earned_total} pts to {nextTier.name}
                </Text>
              </InlineStack>
              <View
                border="base"
                borderRadius="base"
                minBlockSize={8}
                maxBlockSize={8}
              >
                <View
                  background="interactive"
                  borderRadius="base"
                  minBlockSize={8}
                  maxBlockSize={8}
                  maxInlineSize={`${Math.min(100, Math.round((points_earned_total / nextTier.min_points) * 100))}%`}
                />
              </View>
            </BlockStack>
          )}
        </BlockStack>
      </Card>

      {/* -------- Referral Section -------- */}
      <Card padding="base">
        <BlockStack spacing="base">
          <Heading level={2}>Refer Friends</Heading>
          <Text size="small" appearance="subdued">
            Share your link and earn points when friends shop.
          </Text>

          <View border="base" borderRadius="base" padding="base">
            <InlineStack spacing="tight" blockAlignment="center">
              <Text size="small" emphasis="bold">{referralLink}</Text>
              <Button
                kind="plain"
                size="slim"
                onPress={() => {
                  // Extensions can't access clipboard directly — show code
                  setCopiedRef(true);
                  setTimeout(() => setCopiedRef(false), 2000);
                }}
              >
                {copiedRef ? 'Code: ' + referral_code : 'Copy'}
              </Button>
            </InlineStack>
          </View>

          <InlineStack spacing="loose">
            <BlockStack spacing="extraTight">
              <Text size="large" emphasis="bold">
                {referral_stats.direct || 0}
              </Text>
              <Text size="small" appearance="subdued">Direct referrals</Text>
            </BlockStack>
            <BlockStack spacing="extraTight">
              <Text size="large" emphasis="bold">
                {referral_stats.network || 0}
              </Text>
              <Text size="small" appearance="subdued">Network</Text>
            </BlockStack>
            <BlockStack spacing="extraTight">
              <Text size="large" emphasis="bold">
                {referral_earnings || 0}
              </Text>
              <Text size="small" appearance="subdued">Pts earned</Text>
            </BlockStack>
          </InlineStack>
        </BlockStack>
      </Card>

      {/* -------- Redeem Points -------- */}
      {redemption_tiers.length > 0 && (
        <Card padding="base">
          <BlockStack spacing="base">
            <Heading level={2}>Redeem Points</Heading>

            {lastCode && (
              <View border="base" borderRadius="base" padding="base" background="success">
                <InlineStack spacing="tight" blockAlignment="center">
                  <Text emphasis="bold">{lastCode}</Text>
                  <Button
                    kind="plain"
                    size="slim"
                    onPress={() => {
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                  >
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </Button>
                </InlineStack>
              </View>
            )}

            <Grid columns={['fill', 'fill']} spacing="base">
              {redemption_tiers
                .sort((a, b) => a.points - b.points)
                .map((tier) => {
                  const canRedeem = points_balance >= tier.points;
                  return (
                    <View
                      key={tier.id || tier.points}
                      border="base"
                      borderRadius="base"
                      padding="base"
                    >
                      <BlockStack spacing="extraTight">
                        <Text emphasis="bold">{tier.discount} off</Text>
                        <Text size="small" appearance="subdued">
                          {tier.points} points
                        </Text>
                        <Button
                          kind={canRedeem ? 'primary' : 'plain'}
                          disabled={!canRedeem || redeemingTier === tier.points}
                          loading={redeemingTier === tier.points}
                          onPress={() => handleRedeem(tier.points)}
                        >
                          {canRedeem ? 'Redeem' : `Need ${tier.points - points_balance} more`}
                        </Button>
                      </BlockStack>
                    </View>
                  );
                })}
            </Grid>
          </BlockStack>
        </Card>
      )}

      {/* -------- Earn More Points -------- */}
      {earn_actions.length > 0 && (
        <Card padding="base">
          <BlockStack spacing="base">
            <Heading level={2}>Earn Points</Heading>

            {earn_actions
              .filter((a) => a.enabled)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((action) => {
                const done = action.completed || completed_actions.includes(action.slug);
                return (
                  <View key={action.slug}>
                    <InlineStack spacing="base" blockAlignment="center">
                      <View minInlineSize={24}>
                        {done ? (
                          <Badge tone="success">✓</Badge>
                        ) : (
                          <Badge tone="info">{action.points} pts</Badge>
                        )}
                      </View>
                      <BlockStack spacing="none">
                        <Text emphasis={done ? undefined : 'bold'}>
                          {action.label}
                        </Text>
                        <Text size="small" appearance="subdued">
                          {action.points_mode === 'per_amount'
                            ? `${action.points} pts per unit spent`
                            : `${action.points} points`}
                          {action.frequency === 'one_time' && ' · one-time'}
                          {action.frequency === 'yearly' && ' · yearly'}
                        </Text>
                      </BlockStack>
                      {!done && action.category !== 'predefined' && (
                        <Button
                          kind="plain"
                          size="slim"
                          loading={claimingAction === action.slug}
                          onPress={() => handleClaim(action.slug)}
                        >
                          Claim
                        </Button>
                      )}
                    </InlineStack>
                    <Divider />
                  </View>
                );
              })}
          </BlockStack>
        </Card>
      )}

      {/* -------- Recent Activity -------- */}
      {history.length > 0 && (
        <Card padding="base">
          <BlockStack spacing="base">
            <Heading level={2}>Recent Activity</Heading>

            {history.slice(0, 15).map((entry, i) => (
              <View key={i}>
                <InlineStack spacing="base" blockAlignment="center">
                  <BlockStack spacing="none">
                    <Text size="small" emphasis="bold">
                      {TYPE_LABELS[entry.type] || entry.type}
                    </Text>
                    <Text size="small" appearance="subdued">
                      {timeAgo(entry.created_at)}
                    </Text>
                  </BlockStack>
                  <Text
                    size="small"
                    emphasis="bold"
                    appearance={entry.points >= 0 ? 'success' : 'critical'}
                  >
                    {pointsLabel(entry.points)}
                  </Text>
                </InlineStack>
                {i < history.length - 1 && <Divider />}
              </View>
            ))}
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */
function LoadingSkeleton() {
  return (
    <BlockStack spacing="loose">
      <Card padding="base">
        <BlockStack spacing="base">
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
        </BlockStack>
      </Card>
      <Card padding="base">
        <BlockStack spacing="base">
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
        </BlockStack>
      </Card>
      <Card padding="base">
        <BlockStack spacing="base">
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
          <SkeletonText />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
