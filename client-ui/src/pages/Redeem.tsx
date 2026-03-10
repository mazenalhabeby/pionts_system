import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';
import useProgress from '../hooks/useProgress';
import TierCard from '../components/TierCard';
import CopyButton from '../components/CopyButton';
import ProgressRing from '../components/ProgressRing';
import ConfettiEffect from '../components/ConfettiEffect';
import { GiftIcon } from '@pionts/shared';
import type { Redemption, RedemptionTier } from '@pionts/shared';
import { useI18n } from '../i18n';
import { useTimeAgo } from '../i18n/timeAgoLocalized';

export default function Redeem() {
  const { api, settings } = useWidgetConfig();
  const { data, loading, error, refresh } = useCustomer();
  const { t, formatCurrency } = useI18n();
  const timeAgo = useTimeAgo();

  // Get Shopify domain from settings
  const shopifyDomain = (settings as Record<string, unknown>)?.shopify_domain as string | undefined;
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(true);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [confettiCount, setConfettiCount] = useState(0);

  const fetchRedemptions = useCallback(() => {
    api.getMyRedemptions()
      .then(setRedemptions)
      .catch(() => {})
      .finally(() => setRedemptionsLoading(false));
  }, [api]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  const handleRedeem = useCallback(async (tier: RedemptionTier) => {
    setLoadingTier(tier.points);
    setRedeemError(null);
    try {
      await api.redeem(tier.points);
      setConfettiCount((c) => c + 1);
      refresh();
      fetchRedemptions();
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : t('redeem.error_redeem'));
    } finally {
      setLoadingTier(null);
    }
  }, [refresh, fetchRedemptions, api, t]);

  const handleCancel = useCallback(async (redemption: Redemption) => {
    setCancellingId(redemption.id);
    setRedeemError(null);
    try {
      await api.cancelRedemption(redemption.id);
      refresh();
      fetchRedemptions();
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : t('redeem.error_cancel'));
    } finally {
      setCancellingId(null);
    }
  }, [refresh, fetchRedemptions, api, t]);

  const { nextTier, progressPct, tiers } = useProgress(data);
  const unusedCodes = useMemo(() => redemptions.filter((r) => !r.used), [redemptions]);
  const usedCodes = useMemo(() => redemptions.filter((r) => r.used), [redemptions]);

  if (loading) return <div className="pw-loading">{t('common.loading')}</div>;
  if (error) return <div className="pw-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="pw-page-content">
      <ConfettiEffect active={confettiCount > 0} key={confettiCount} />

      {/* Page Header */}
      <div className="pw-page-header">
        <div className="pw-page-header__icon pw-page-header__icon--brand">
          <GiftIcon size={24} />
        </div>
        <div>
          <div className="pw-page-header__title">{t('redeem.title')}</div>
          <div className="pw-page-header__subtitle">{t('redeem.subtitle')}</div>
        </div>
      </div>

      {/* Balance + Progress Ring */}
      <div className="pw-section pw-section--padded">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <ProgressRing size={100} radius={42} strokeWidth={7} progressPct={progressPct} gradientId="redeem-grad" style={{ flexShrink: 0 }}>
            <div className="pw-ring__content">
              <div className="pw-ring__value">{data.points_balance}</div>
              <div className="pw-ring__label">{t('common.pts')}</div>
            </div>
          </ProgressRing>
          <div style={{ flex: 1 }}>
            <div className="pw-section__title" style={{ marginBottom: 4 }}>{t('redeem.balance_label')}</div>
            {nextTier ? (
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 12 }}>
                {t('redeem.pts_to_unlock', { pts: nextTier.points - data.points_balance, currency: formatCurrency(nextTier.discount) })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 12 }}>{t('redeem.all_unlocked')}</div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tiers.map((ti) => (
                <span
                  key={ti.points}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 100,
                    ...(data.points_balance >= ti.points
                      ? { color: 'var(--pionts-primary, #3b82f6)', background: 'color-mix(in srgb, var(--pionts-primary, #3b82f6) 12%, transparent)' }
                      : { color: '#52525b', background: 'rgba(255,255,255,0.06)' }),
                  }}
                >
                  {ti.points}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Error */}
      {redeemError && <div className="pw-error">{redeemError}</div>}

      {/* Tier Cards */}
      <div className="pw-section pw-section--padded">
        <div className="pw-section__title" style={{ marginBottom: 16 }}>{t('redeem.choose_reward')}</div>
        <div className="pw-tier-card__grid">
          {tiers.map((tier, i) => (
            <TierCard
              key={tier.points}
              points={tier.points}
              discount={tier.discount}
              canRedeem={data.points_balance >= tier.points}
              loading={loadingTier === tier.points}
              onRedeem={() => handleRedeem(tier)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Active Discount Codes */}
      {!redemptionsLoading && unusedCodes.length > 0 && (
        <div className="pw-section pw-section--padded">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="pw-section__title">{t('redeem.discount_codes')}</div>
            <span className="pw-table__badge pw-table__badge--active">{t('redeem.active_count', { count: unusedCodes.length })}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unusedCodes.map((r) => {
              const checkoutUrl = shopifyDomain
                ? `https://${shopifyDomain}/discount/${r.discount_code}`
                : null;

              return (
                <div key={r.id} className="pw-discount-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#fafafa' }}>{t('redeem.off', { currency: formatCurrency(r.discount_amount) })}</span>
                      </div>
                      <div style={{ fontFamily: "'SF Mono', Monaco, monospace", fontSize: 12, color: '#a1a1aa', letterSpacing: 0.5 }}>{r.discount_code}</div>
                      <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{timeAgo(r.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      {checkoutUrl && (
                        <button
                          type="button"
                          className="pw-btn pw-btn--sm pw-btn--primary"
                          onClick={() => window.open(checkoutUrl, '_blank')}
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          🛍️ Apply & Checkout
                        </button>
                      )}
                      <CopyButton text={r.discount_code} />
                      <button
                        type="button"
                        className="pw-btn pw-btn--sm pw-btn--cancel"
                        disabled={cancellingId === r.id}
                        onClick={() => handleCancel(r)}
                      >
                        {cancellingId === r.id ? '...' : t('common.cancel')}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                    {checkoutUrl
                      ? `Click "Apply & Checkout" to automatically apply this discount, or copy code to use later. Cancel to get ${r.points_spent} points back.`
                      : t('redeem.cancel_hint', { pts: r.points_spent })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Used Codes */}
      {!redemptionsLoading && usedCodes.length > 0 && (
        <div className="pw-section pw-section--padded">
          <div className="pw-section__title" style={{ marginBottom: 12 }}>{t('redeem.used_codes')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {usedCodes.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', opacity: 0.6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#71717a' }}>{t('redeem.off', { currency: formatCurrency(r.discount_amount) })}</span>
                  <span style={{ fontSize: 11, color: '#52525b', marginLeft: 8 }}>{timeAgo(r.created_at)}</span>
                </div>
                <span className="pw-table__badge">{t('redeem.badge_used')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
