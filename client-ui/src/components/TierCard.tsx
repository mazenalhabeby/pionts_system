import React from 'react';
import { useI18n } from '../i18n';

interface TierCardProps {
  points: number;
  discount: number;
  canRedeem: boolean;
  onRedeem: () => void;
  loading?: boolean;
  index?: number;
}

const TINTS = ['pw-tier-card--tint-1', 'pw-tier-card--tint-2', 'pw-tier-card--tint-3', 'pw-tier-card--tint-4'];

const TierCard = React.memo(function TierCard({ points, discount, canRedeem, onRedeem, loading, index = 0 }: TierCardProps) {
  const { t, formatCurrency } = useI18n();
  const tint = TINTS[index % TINTS.length];
  return (
    <div className={`pw-tier-card ${canRedeem ? `pw-tier-card--redeemable ${tint}` : 'pw-tier-card--locked'}`}>
      {!canRedeem && (
        <div className="pw-tier-card__lock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
      )}
      <div className="pw-tier-card__discount">{formatCurrency(discount)}</div>
      <div className="pw-tier-card__points">{points} {t('common.pts')}</div>
      <button
        className="pw-tier-card__btn"
        disabled={!canRedeem || loading}
        onClick={onRedeem}
        type="button"
      >
        {loading ? '...' : canRedeem ? t('redeem.btn_redeem') : t('redeem.btn_locked')}
      </button>
    </div>
  );
});

export default TierCard;
