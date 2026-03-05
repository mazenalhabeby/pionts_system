import useCustomer from '../hooks/useCustomer';
import useProgress from '../hooks/useProgress';
import useTier from '../hooks/useTier';
import HistoryEntry from '../components/HistoryEntry';
import CopyButton from '../components/CopyButton';
import TierBadge from '../components/TierBadge';
import AnimatedCounter from '../components/AnimatedCounter';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import { useI18n } from '../i18n';

export default function Dashboard() {
  const { data, loading, error } = useCustomer();
  const { settings } = useWidgetConfig();
  const { t, formatCurrency } = useI18n();
  const { nextTier, progressPct } = useProgress(data);
  const tier = useTier(settings as Record<string, string> | undefined, data?.points_earned_total || 0);

  const modules = data?.enabled_modules;
  const isPartner = !!(modules?.partners && data?.is_partner);
  const referralsEnabled = !isPartner && modules?.referrals !== false;
  const redeemStats = data?.redemption_stats || {};
  const refStats = data?.referral_stats || { direct: 0, network: 0 };

  if (loading) return <div className="pw-loading">{t('common.loading')}</div>;
  if (error) return <div className="pw-error">{error}</div>;
  if (!data) return null;

  const history = data.history || [];
  const refEarnings = data.referral_earnings || 0;
  const storeUrl = settings?.referral_base_url || '';
  const refUrl = storeUrl ? `${storeUrl}${storeUrl.includes('?') ? '&' : '?'}ref=${data.referral_code}` : '';
  const partnerInfo = data.partner_info;

  return (
    <div className="pw-dashboard">

      {/* HERO */}
      <div className="pw-hero">
        <div className="pw-hero__card">
          <div className="pw-hero__content">
            <div className="pw-hero__header">
              <div>
                <p className="pw-hero__greeting">{t('dashboard.welcome')}</p>
                <div className="pw-hero__name">{data.name?.split(' ')[0] || t('dashboard.there')}</div>
              </div>
              {isPartner && partnerInfo ? (
                <div className="pw-hero__balance">
                  <div className="pw-hero__points">{formatCurrency(partnerInfo.credit_balance)}</div>
                  <div className="pw-hero__label">{t('dashboard.credit_balance')}</div>
                </div>
              ) : (
                <>
                  <div className="pw-hero__balance">
                    <AnimatedCounter value={data.points_balance} className="pw-hero__points" />
                    <div className="pw-hero__label">{t('dashboard.points_available')}</div>
                  </div>
                  {tier.enabled && (
                    <div className="pw-hero__tier">
                      <TierBadge tier={tier.currentTier} multiplier={tier.currentMultiplier} />
                    </div>
                  )}
                </>
              )}
            </div>

            {!isPartner && (
              <div className="pw-progress" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100} aria-label={t('dashboard.progress_label')}>
                <div className="pw-progress__track">
                  <div
                    className="pw-progress__fill"
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>
                <div className="pw-progress__text">
                  {nextTier
                    ? t('dashboard.progress_to_next', { pts: nextTier.points - data.points_balance, currency: formatCurrency(nextTier.discount) })
                    : t('dashboard.top_tier')
                  }
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="pw-stats">
            {isPartner && partnerInfo ? (
              <>
                <div className="pw-stat stat-green">
                  <div className="pw-stat__number">{formatCurrency(partnerInfo.total_earned)}</div>
                  <div className="pw-stat__label">{t('dashboard.stat_total_earned')}</div>
                </div>
                <div className="pw-stat stat-blue">
                  <div className="pw-stat__number">{partnerInfo.commission_pct}%</div>
                  <div className="pw-stat__label">{t('dashboard.stat_commission')}</div>
                </div>
                <div className="pw-stat stat-orange">
                  <div className="pw-stat__number">{refStats.direct ?? 0}</div>
                  <div className="pw-stat__label">{t('dashboard.stat_referrals')}</div>
                </div>
                <div className="pw-stat stat-purple">
                  <div className="pw-stat__number">{partnerInfo.total_orders}</div>
                  <div className="pw-stat__label">{t('dashboard.stat_orders')}</div>
                </div>
              </>
            ) : (
              <>
                <div className="pw-stat stat-green">
                  <div className="pw-stat__number">{data.points_earned_total}</div>
                  <div className="pw-stat__label">{t('dashboard.stat_earned')}</div>
                </div>
                <div className="pw-stat stat-blue">
                  <div className="pw-stat__number">{formatCurrency(redeemStats.total_redeemed || 0)}</div>
                  <div className="pw-stat__label">{t('dashboard.stat_saved')}</div>
                </div>
                <div className="pw-stat stat-purple">
                  <div className="pw-stat__number">{data.order_count}</div>
                  <div className="pw-stat__label">{t('dashboard.stat_orders')}</div>
                </div>
                {referralsEnabled && (
                  <>
                    <div className="pw-stat stat-orange">
                      <div className="pw-stat__number">{refStats.direct ?? 0}</div>
                      <div className="pw-stat__label">{t('dashboard.stat_referrals')}</div>
                    </div>
                    <div className="pw-stat stat-purple">
                      <div className="pw-stat__number">{refEarnings}</div>
                      <div className="pw-stat__label">{t('dashboard.stat_ref_pts')}</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* REFERRAL LINK + ACTIVITY */}
      <div className="pw-grid-2col">

        {/* Partner Link or Referral Link */}
        {isPartner ? (
          <div className="pw-share">
            <div className="pw-share__top">
              <div className="pw-share__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </div>
              <h2 className="pw-share__title">{t('dashboard.partner_link')}</h2>
              <p className="pw-share__subtitle">{t('dashboard.share_earn_commission', { pct: partnerInfo?.commission_pct || 0 })}</p>
            </div>
            <div className="pw-share__body">
              <div className="pw-share__link">
                <input
                  type="text"
                  value={refUrl}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <CopyButton text={refUrl} />
              </div>
              <div className="pw-share__footer">
                <span className="pw-share__stat">
                  <span className="pw-share__stat-num">{refStats.direct ?? 0}</span> {t('dashboard.referrals')}
                </span>
                <span className="pw-share__stat">
                  <span className="pw-share__stat-num">{formatCurrency(partnerInfo?.total_earned || 0)}</span> {t('dashboard.earned')}
                </span>
              </div>
            </div>
          </div>
        ) : referralsEnabled ? (
          <div className="pw-share">
            <div className="pw-share__top">
              <div className="pw-share__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </div>
              <h2 className="pw-share__title">{t('dashboard.share_earn')}</h2>
              <p className="pw-share__subtitle">{t('dashboard.share_subtitle', { discount: String(settings?.referral_discount_percent || '5') })}</p>
            </div>
            <div className="pw-share__body">
              <div className="pw-share__link">
                <input
                  type="text"
                  value={refUrl}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <CopyButton text={refUrl} />
              </div>
              <div className="pw-share__footer">
                <span className="pw-share__stat">
                  <span className="pw-share__stat-num">{refStats.direct ?? 0}</span> {t('dashboard.referrals')}
                </span>
                <span className="pw-share__stat">
                  <span className="pw-share__stat-num">{refEarnings}</span> {t('dashboard.pts_earned')}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Recent Activity */}
        <div className="pw-activity" style={!referralsEnabled && !isPartner ? { gridColumn: '1 / -1' } : undefined}>
          <div className="pw-activity__top">
            <div className="pw-activity__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h2 className="pw-activity__title">{t('dashboard.recent_activity')}</h2>
            {history.length > 0 && (
              <span className="pw-activity__count">{history.length}</span>
            )}
          </div>
          <div className="pw-activity__body">
            {history.length === 0 ? (
              <div className="pw-activity__empty">{t('dashboard.no_activity')}</div>
            ) : (
              <ul className="pw-activity__list activity-list-scroll">
                {history.map((entry, i) => (
                  <HistoryEntry
                    key={entry.id || i}
                    points={entry.points}
                    description={entry.description}
                    created_at={entry.created_at}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
