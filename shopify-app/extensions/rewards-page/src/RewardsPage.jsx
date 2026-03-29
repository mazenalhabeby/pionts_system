import { useState, useEffect, useCallback } from 'react';
import {
  reactExtension,
  useSettings,
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineLayout,
  Text,
  Heading,
  HeadingGroup,
  Button,
  Badge,
  Banner,
  Divider,
  Grid,
  GridItem,
  View,
  Icon,
  Progress,
  Tag,
  List,
  ListItem,
  SkeletonText,
  SkeletonTextBlock,
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

const TYPE_ICONS = {
  signup: 'star',
  purchase: 'cart',
  first_order: 'gift',
  referral_l2: 'profile',
  referral_l3: 'profile',
  review_photo: 'camera',
  review_text: 'note',
  follow_tiktok: 'heart',
  follow_instagram: 'heart',
  share_product: 'share',
  birthday: 'gift',
  redeem: 'discount',
  clawback: 'revert',
  manual_award: 'star',
  manual_deduct: 'minus',
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
  const settings = useSettings();

  // Manual settings (entered by merchant in Shopify admin) — take priority
  const manualProjectKey = settings.project_key || '';
  const manualApiBase = (settings.api_base || '').replace(/\/+$/, '');
  const manualSecretKey = settings.secret_key || '';

  const [config, setConfig] = useState({
    projectKey: manualProjectKey,
    apiBase: manualApiBase,
    secretKey: manualSecretKey,
    resolved: !!(manualProjectKey && manualApiBase && manualSecretKey),
  });
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeemingTier, setRedeemingTier] = useState(null);
  const [lastCode, setLastCode] = useState(null);
  const [claimingAction, setClaimingAction] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  /* ---- Resolve shop domain from Shopify Customer Account API ---- */
  const fetchShopDomain = useCallback(async () => {
    try {
      const res = await fetch('shopify://customer-account/api/2025-04/graphql.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { shop { id name } }`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        // Shop ID format: gid://shopify/Shop/12345 — not directly the domain
        // Fallback: extract from the page URL or use extension host
        return json?.data?.shop?.name || '';
      }
    } catch { /* silent */ }
    return '';
  }, []);

  /* ---- Fetch customer email via Customer Account API ---- */
  const fetchCustomerEmail = useCallback(async () => {
    try {
      const res = await fetch('shopify://customer-account/api/2025-04/graphql.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { customer { firstName lastName emailAddress { emailAddress } } }`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const c = json?.data?.customer;
        const email = c?.emailAddress?.emailAddress;
        if (email) return { email, name: c?.firstName || '' };
      }
    } catch { /* silent */ }
    return { email: '', name: '' };
  }, []);

  /* ---- Auto-resolve config from backend if manual settings are empty ---- */
  useEffect(() => {
    if (config.resolved) return; // Manual settings present, skip auto-resolve

    let cancelled = false;
    (async () => {
      try {
        // Try well-known API bases to find the extension config
        // The app's own API base is embedded in metafields during install
        const shopDomain = window.location.hostname?.includes('shopify.com')
          ? '' : '';

        // Use the Customer Account API to get the shop's myshopify domain
        const shopRes = await fetch('shopify://customer-account/api/2025-04/graphql.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query { shop { primaryDomain { host } myshopifyDomain } }`,
          }),
        });

        let myshopifyDomain = '';
        if (shopRes.ok) {
          const shopJson = await shopRes.json();
          myshopifyDomain = shopJson?.data?.shop?.myshopifyDomain || '';
        }

        if (!myshopifyDomain) {
          // Fallback: try extracting from the page URL for dev stores
          const match = document.referrer?.match(/([a-z0-9-]+\.myshopify\.com)/i);
          if (match) myshopifyDomain = match[1];
        }

        if (!myshopifyDomain || cancelled) return;

        // Fetch extension config from Pionts backend
        // Try multiple known API bases (the app URL set during install)
        const apiCandidates = [
          manualApiBase,
          'https://hbc-solution.io/v2',
          'https://app.pionts.com',
        ].filter(Boolean);

        for (const base of apiCandidates) {
          try {
            const cfgRes = await fetch(`${base}/shopify/extension-config?shop=${encodeURIComponent(myshopifyDomain)}`);
            if (cfgRes.ok) {
              const cfg = await cfgRes.json();
              if (cfg.configured && cfg.projectKey && !cancelled) {
                setConfig({
                  projectKey: cfg.projectKey,
                  apiBase: cfg.apiBase.replace(/\/+$/, ''),
                  secretKey: cfg.hmacSecret,
                  resolved: true,
                });
                return;
              }
            }
          } catch { /* try next candidate */ }
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [config.resolved, manualApiBase]);

  /* ---- Fetch Pionts data ---- */
  const fetchPiontsData = useCallback(
    async (email) => {
      if (!config.apiBase || !config.projectKey || !email) return null;
      const hmac = await hmacSha256(config.secretKey, email);
      const res = await fetch(`${config.apiBase}/api/v1/sdk/customer`, {
        headers: {
          'X-Project-Key': config.projectKey,
          'X-Customer-Email': email,
          'X-Customer-HMAC': hmac,
        },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json();
    },
    [config.apiBase, config.projectKey, config.secretKey],
  );

  /* ---- Load data on mount (waits for config to resolve) ---- */
  useEffect(() => {
    if (!config.resolved) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const result = await fetchCustomerEmail();
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
  }, [config.resolved, fetchCustomerEmail, fetchPiontsData]);

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

  /* ---- Redeem handler ---- */
  const handleRedeem = useCallback(
    async (tierPoints) => {
      if (!customer) return;
      setRedeemingTier(tierPoints);
      try {
        const hmac = await hmacSha256(config.secretKey, customer.email);
        const res = await fetch(`${config.apiBase}/api/v1/sdk/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': config.projectKey,
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
    [customer, config.apiBase, config.projectKey, config.secretKey, refresh],
  );

  /* ---- Claim action handler ---- */
  const handleClaim = useCallback(
    async (slug) => {
      if (!customer) return;
      setClaimingAction(slug);
      try {
        const hmac = await hmacSha256(config.secretKey, customer.email);
        const headers = {
          'Content-Type': 'application/json',
          'X-Project-Key': config.projectKey,
          'X-Customer-Email': customer.email,
          'X-Customer-HMAC': hmac,
        };
        if (slug.startsWith('follow_')) {
          await fetch(`${config.apiBase}/api/v1/sdk/social/initiate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ type: slug }),
          });
        }
        const res = await fetch(`${config.apiBase}/api/v1/sdk/award`, {
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
    [customer, config.apiBase, config.projectKey, config.secretKey, refresh],
  );

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  if (!config.projectKey || !config.apiBase) {
    return (
      <Card padding="base">
        <BlockStack spacing="base">
          <Heading>Rewards</Heading>
          <Banner status="warning">
            Rewards are not configured yet. Please contact the store owner.
          </Banner>
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
          <Banner status="critical" title="Something went wrong">
            {error}
          </Banner>
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
          <Banner status="warning">
            Unable to load your rewards. Please try again later.
          </Banner>
        </BlockStack>
      </Card>
    );
  }

  const points_balance = customer.points_balance ?? 0;
  const points_earned_total = customer.points_earned_total ?? 0;
  const order_count = customer.order_count ?? 0;
  const referral_code = customer.referral_code ?? '';
  const referral_stats = customer.referral_stats ?? {};
  const referral_earnings = customer.referral_earnings ?? 0;
  const redemption_tiers = Array.isArray(customer.redemption_tiers) ? customer.redemption_tiers : [];
  const earn_actions = Array.isArray(customer.earn_actions) ? customer.earn_actions : [];
  const completed_actions = Array.isArray(customer.completed_actions) ? customer.completed_actions : [];
  const history = Array.isArray(customer.history) ? customer.history : [];
  const projSettings = customer.settings ?? {};

  const referralLink = projSettings.referral_base_url
    ? `${projSettings.referral_base_url}?ref=${referral_code}`
    : `?ref=${referral_code}`;

  const tiers = Array.isArray(projSettings.gamification_tiers) ? projSettings.gamification_tiers : [];
  const currentTier = tiers
    .filter((t) => points_earned_total >= (t.min_points || 0))
    .sort((a, b) => (b.min_points || 0) - (a.min_points || 0))[0];
  const nextTier = tiers
    .filter((t) => (t.min_points || 0) > points_earned_total)
    .sort((a, b) => (a.min_points || 0) - (b.min_points || 0))[0];

  const tierProgress = nextTier
    ? Math.min(100, Math.round((points_earned_total / nextTier.min_points) * 100))
    : 100;

  const enabledActions = earn_actions.filter((a) => a.enabled).sort((a, b) => a.sort_order - b.sort_order);
  const sortedTiers = [...redemption_tiers].sort((a, b) => a.points - b.points);

  return (
    <BlockStack spacing="loose">

      {/* ════════════ POINTS BALANCE HERO ════════════ */}
      <Card padding="loose">
        <BlockStack spacing="base">
          <InlineStack spacing="tight" blockAlignment="center">
            <Icon source="star" appearance="accent" />
            <Heading>Your Rewards</Heading>
            {currentTier && (
              <Badge tone="info">{currentTier.name || 'Member'}</Badge>
            )}
          </InlineStack>

          <Divider />

          <InlineLayout columns={['fill', 'auto']} blockAlignment="center">
            <BlockStack spacing="extraTight">
              <Text size="extraLarge" emphasis="bold">
                {points_balance.toLocaleString()}
              </Text>
              <Text size="small" appearance="subdued">
                Available points
              </Text>
            </BlockStack>
            <BlockStack spacing="extraTight">
              <InlineStack spacing="tight">
                <BlockStack spacing="none">
                  <Text size="small" emphasis="bold">{points_earned_total.toLocaleString()}</Text>
                  <Text size="extraSmall" appearance="subdued">Total earned</Text>
                </BlockStack>
                <BlockStack spacing="none">
                  <Text size="small" emphasis="bold">{order_count}</Text>
                  <Text size="extraSmall" appearance="subdued">Order{order_count !== 1 ? 's' : ''}</Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </InlineLayout>

          {nextTier && (
            <BlockStack spacing="extraTight">
              <InlineLayout columns={['fill', 'auto']}>
                <Text size="small" appearance="subdued">
                  Progress to {nextTier.name}
                </Text>
                <Text size="small" emphasis="bold">
                  {tierProgress}%
                </Text>
              </InlineLayout>
              <Progress value={tierProgress} />
              <Text size="extraSmall" appearance="subdued">
                {(nextTier.min_points - points_earned_total).toLocaleString()} more points needed
              </Text>
            </BlockStack>
          )}

          {!nextTier && tiers.length > 0 && (
            <Banner status="success" title="Top tier reached!">
              You've reached the highest rewards tier.
            </Banner>
          )}
        </BlockStack>
      </Card>

      {/* ════════════ REDEEM POINTS ════════════ */}
      {sortedTiers.length > 0 && (
        <Card padding="loose">
          <BlockStack spacing="base">
            <InlineStack spacing="tight" blockAlignment="center">
              <Icon source="discount" appearance="accent" />
              <Heading level={2}>Redeem Points</Heading>
            </InlineStack>

            <Divider />

            {lastCode && (
              <Banner status="success" title="Discount code created!">
                <BlockStack spacing="tight">
                  <Text>Use this code at checkout:</Text>
                  <ClipboardItem value={lastCode}>
                    <Text emphasis="bold" size="large">{lastCode}</Text>
                  </ClipboardItem>
                </BlockStack>
              </Banner>
            )}

            <Grid columns={['fill', 'fill']} spacing="base">
              {sortedTiers.map((tier) => {
                const canRedeem = points_balance >= tier.points;
                const pct = Math.min(100, Math.round((points_balance / tier.points) * 100));
                return (
                  <Card key={tier.id || tier.points} padding="base">
                    <BlockStack spacing="tight">
                      <InlineStack spacing="tight" blockAlignment="center">
                        <Icon source="discount" />
                        <Text emphasis="bold">{tier.discount} off</Text>
                      </InlineStack>
                      <Text size="small" appearance="subdued">
                        {tier.points.toLocaleString()} points
                      </Text>
                      <Progress value={canRedeem ? 100 : pct} />
                      <Button
                        kind={canRedeem ? 'primary' : 'secondary'}
                        disabled={!canRedeem || redeemingTier === tier.points}
                        loading={redeemingTier === tier.points}
                        onPress={() => handleRedeem(tier.points)}
                      >
                        {canRedeem ? 'Redeem' : `${(tier.points - points_balance).toLocaleString()} more pts`}
                      </Button>
                    </BlockStack>
                  </Card>
                );
              })}
            </Grid>
          </BlockStack>
        </Card>
      )}

      {/* ════════════ REFER FRIENDS ════════════ */}
      <Card padding="loose">
        <BlockStack spacing="base">
          <InlineStack spacing="tight" blockAlignment="center">
            <Icon source="profile" appearance="accent" />
            <Heading level={2}>Refer Friends</Heading>
          </InlineStack>

          <Divider />

          <Text size="small" appearance="subdued">
            Share your referral link and earn points when friends make a purchase.
          </Text>

          <Card padding="base">
            <BlockStack spacing="tight">
              <Text size="extraSmall" appearance="subdued">Your referral link</Text>
              <InlineStack spacing="tight" blockAlignment="center">
                <Text emphasis="bold" size="small">{referralLink}</Text>
                <Button kind="secondary" onPress={async () => {
                  try { await navigator.clipboard.writeText(referralLink); } catch {}
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }} accessibilityLabel="Copy referral link">
                  {copiedLink ? 'Copied!' : 'Copy'}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          <Grid columns={['fill', 'fill', 'fill']} spacing="base">
            <Card padding="base">
              <BlockStack spacing="extraTight">
                <Text size="large" emphasis="bold">
                  {referral_stats.direct || 0}
                </Text>
                <Text size="extraSmall" appearance="subdued">Direct referrals</Text>
              </BlockStack>
            </Card>
            <Card padding="base">
              <BlockStack spacing="extraTight">
                <Text size="large" emphasis="bold">
                  {referral_stats.network || 0}
                </Text>
                <Text size="extraSmall" appearance="subdued">Network</Text>
              </BlockStack>
            </Card>
            <Card padding="base">
              <BlockStack spacing="extraTight">
                <Text size="large" emphasis="bold">
                  {referral_earnings || 0}
                </Text>
                <Text size="extraSmall" appearance="subdued">Pts earned</Text>
              </BlockStack>
            </Card>
          </Grid>
        </BlockStack>
      </Card>

      {/* ════════════ EARN POINTS ════════════ */}
      {enabledActions.length > 0 && (
        <Card padding="loose">
          <BlockStack spacing="base">
            <InlineStack spacing="tight" blockAlignment="center">
              <Icon source="star" appearance="accent" />
              <Heading level={2}>Earn Points</Heading>
            </InlineStack>

            <Divider />

            {enabledActions.map((action) => {
              const done = action.completed || completed_actions.includes(action.slug);
              return (
                <View key={action.slug}>
                  <InlineLayout columns={['auto', 'fill', 'auto']} spacing="base" blockAlignment="center">
                    <View>
                      {done ? (
                        <Badge tone="success">
                          <InlineStack spacing="extraTight" blockAlignment="center">
                            <Icon source="checkCircle" size="small" />
                            <Text size="extraSmall">Done</Text>
                          </InlineStack>
                        </Badge>
                      ) : (
                        <Tag icon="star">{action.points} pts</Tag>
                      )}
                    </View>

                    <BlockStack spacing="none">
                      <Text emphasis={done ? undefined : 'bold'} size="small">
                        {action.label}
                      </Text>
                      <Text size="extraSmall" appearance="subdued">
                        {action.points_mode === 'per_amount'
                          ? `${action.points} pts per unit spent`
                          : `${action.points} points`}
                        {action.frequency === 'one_time' && ' · one-time'}
                        {action.frequency === 'yearly' && ' · yearly'}
                      </Text>
                    </BlockStack>

                    <View>
                      {!done && action.category !== 'predefined' && (
                        <Button
                          kind="secondary"
                          size="slim"
                          loading={claimingAction === action.slug}
                          onPress={() => handleClaim(action.slug)}
                        >
                          Claim
                        </Button>
                      )}
                    </View>
                  </InlineLayout>
                  <Divider />
                </View>
              );
            })}
          </BlockStack>
        </Card>
      )}

      {/* ════════════ RECENT ACTIVITY ════════════ */}
      {history.length > 0 && (
        <Card padding="loose">
          <BlockStack spacing="base">
            <InlineStack spacing="tight" blockAlignment="center">
              <Icon source="clock" appearance="accent" />
              <Heading level={2}>Recent Activity</Heading>
            </InlineStack>

            <Divider />

            {history.slice(0, 15).map((entry, i) => (
              <View key={i}>
                <InlineLayout columns={['fill', 'auto']} spacing="base" blockAlignment="center">
                  <InlineStack spacing="tight" blockAlignment="center">
                    <Icon
                      source={TYPE_ICONS[entry.type] || 'note'}
                      size="small"
                      appearance={entry.points >= 0 ? 'accent' : 'critical'}
                    />
                    <BlockStack spacing="none">
                      <Text size="small" emphasis="bold">
                        {TYPE_LABELS[entry.type] || entry.type}
                      </Text>
                      <Text size="extraSmall" appearance="subdued">
                        {timeAgo(entry.created_at)}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Badge tone={entry.points >= 0 ? 'success' : 'critical'}>
                    {pointsLabel(entry.points)}
                  </Badge>
                </InlineLayout>
                {i < Math.min(history.length, 15) - 1 && <Divider />}
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
      <Card padding="loose">
        <BlockStack spacing="base">
          <SkeletonText />
          <Divider />
          <InlineLayout columns={['fill', 'auto']}>
            <SkeletonTextBlock lines={2} />
            <SkeletonText />
          </InlineLayout>
          <SkeletonText />
        </BlockStack>
      </Card>
      <Card padding="loose">
        <BlockStack spacing="base">
          <SkeletonText />
          <Divider />
          <Grid columns={['fill', 'fill']} spacing="base">
            <SkeletonTextBlock lines={3} />
            <SkeletonTextBlock lines={3} />
          </Grid>
        </BlockStack>
      </Card>
      <Card padding="loose">
        <BlockStack spacing="base">
          <SkeletonText />
          <Divider />
          <SkeletonTextBlock lines={3} />
        </BlockStack>
      </Card>
      <Card padding="loose">
        <BlockStack spacing="base">
          <SkeletonText />
          <Divider />
          <SkeletonTextBlock lines={4} />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
