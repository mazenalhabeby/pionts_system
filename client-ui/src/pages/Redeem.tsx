import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';
import useProgress from '../hooks/useProgress';
import TierCard from '../components/TierCard';
import CopyButton from '../components/CopyButton';
import ProgressRing from '../components/ProgressRing';
import ConfettiEffect from '../components/ConfettiEffect';
import { GiftIcon, timeAgo } from '@pionts/shared';
import type { Redemption, RedemptionTier } from '@pionts/shared';

export default function Redeem() {
  const { api } = useWidgetConfig();
  const { data, loading, error, refresh } = useCustomer();
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
      setRedeemError(err instanceof Error ? err.message : 'Redemption failed. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  }, [refresh, fetchRedemptions, api]);

  const handleCancel = useCallback(async (redemption: Redemption) => {
    setCancellingId(redemption.id);
    setRedeemError(null);
    try {
      await api.cancelRedemption(redemption.id);
      refresh();
      fetchRedemptions();
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : 'Cancel failed. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }, [refresh, fetchRedemptions, api]);

  const { nextTier, progressPct, tiers } = useProgress(data);
  const unusedCodes = useMemo(() => redemptions.filter((r) => !r.used), [redemptions]);
  const usedCodes = useMemo(() => redemptions.filter((r) => r.used), [redemptions]);

  if (loading) return <div className="pw-loading">Loading...</div>;
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
          <div className="pw-page-header__title">Redeem Points</div>
          <div className="pw-page-header__subtitle">Spend your points on discounts</div>
        </div>
      </div>

      {/* Balance + Progress Ring */}
      <div className="pw-section pw-section--padded">
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <ProgressRing size={100} radius={42} strokeWidth={7} progressPct={progressPct} gradientId="redeem-grad" style={{ flexShrink: 0 }}>
            <div className="pw-ring__content">
              <div className="pw-ring__value">{data.points_balance}</div>
              <div className="pw-ring__label">pts</div>
            </div>
          </ProgressRing>
          <div style={{ flex: 1 }}>
            <div className="pw-section__title" style={{ marginBottom: 4 }}>Available Balance</div>
            {nextTier ? (
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: 'var(--pionts-primary, #3b82f6)' }}>{nextTier.points - data.points_balance}</span> pts to unlock &euro;{nextTier.discount} off
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>All tiers unlocked!</div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tiers.map((t) => (
                <span
                  key={t.points}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 100,
                    ...(data.points_balance >= t.points
                      ? { color: 'var(--pionts-primary, #3b82f6)', background: 'color-mix(in srgb, var(--pionts-primary, #3b82f6) 10%, #fff)' }
                      : { color: '#ccc', background: '#f5f5f7' }),
                  }}
                >
                  {t.points}
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
        <div className="pw-section__title" style={{ marginBottom: 16 }}>Choose a Reward</div>
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
            <div className="pw-section__title">Your Discount Codes</div>
            <span className="pw-table__badge pw-table__badge--active">{unusedCodes.length} active</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unusedCodes.map((r) => (
              <div key={r.id} className="pw-discount-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>&euro;{r.discount_amount} off</span>
                    </div>
                    <div style={{ fontFamily: "'SF Mono', Monaco, monospace", fontSize: 12, color: '#6b7280', letterSpacing: 0.5 }}>{r.discount_code}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{timeAgo(r.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <CopyButton text={r.discount_code} label="Copy" />
                    <button
                      type="button"
                      className="pw-btn pw-btn--sm pw-btn--cancel"
                      disabled={cancellingId === r.id}
                      onClick={() => handleCancel(r)}
                    >
                      {cancellingId === r.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                  Cancel to get <strong style={{ color: '#1f2937' }}>{r.points_spent} pts</strong> back and save for a bigger reward.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used Codes */}
      {!redemptionsLoading && usedCodes.length > 0 && (
        <div className="pw-section pw-section--padded">
          <div className="pw-section__title" style={{ marginBottom: 12 }}>Used Codes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {usedCodes.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#f9fafb', opacity: 0.6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>&euro;{r.discount_amount} off</span>
                  <span style={{ fontSize: 11, color: '#ccc', marginLeft: 8 }}>{timeAgo(r.created_at)}</span>
                </div>
                <span className="pw-table__badge">USED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
