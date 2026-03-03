import { useState, useCallback } from 'react';
import useReferrals from '../../hooks/useReferrals';
import { UsersIcon, countDescendants } from '@pionts/shared';
import { useWidgetConfig } from '../../context/WidgetConfigContext';
import ReferralLinkSection from './ReferralLinkSection';
import NetworkTreeSection from './NetworkTreeSection';

export default function Referrals() {
  const { data, loading, error } = useReferrals();
  const { settings } = useWidgetConfig();
  const [tab, setTab] = useState<'referrals' | 'network'>('referrals');
  const [treeGen, setTreeGen] = useState<number | null>(null);
  const defaultLabels = ['Level 1', 'Level 2', 'Level 3'];
  const defaultEarn = ['earns you 5 pts/order', 'earns you 2 pts/order', ''];
  const levelLabels = settings?.level_labels && settings.level_labels.length > 0 ? settings.level_labels : defaultLabels;
  const levelEarn = settings?.level_earn && settings.level_earn.length > 0 ? settings.level_earn : defaultEarn;

  const expandAll = useCallback(() => setTreeGen((g) => Math.abs(g || 0) + 1), []);
  const collapseAll = useCallback(() => setTreeGen((g) => -(Math.abs(g || 0) + 1)), []);

  if (loading) return <div className="pw-loading">Loading...</div>;
  if (error) return <div className="pw-error">{error}</div>;
  if (!data) return null;

  const directReferrals = data.direct_referrals || [];
  const downlineTree = data.downline_tree || [];
  const storeUrl = String(settings?.referral_base_url || '');
  const refUrl = data.referral_link || (storeUrl ? `${storeUrl}${storeUrl.includes('?') ? '&' : '?'}ref=${data.referral_code}` : '');
  const directCount = data.stats?.direct ?? 0;
  const networkCount = data.stats?.network ?? 0;
  const totalDescendants = downlineTree.reduce((s, n) => s + 1 + countDescendants(n), 0);

  return (
    <div className="pw-page-content">
      {/* Page Header */}
      <div className="pw-page-header">
        <div className="pw-page-header__icon pw-page-header__icon--sky">
          <UsersIcon size={24} />
        </div>
        <div>
          <div className="pw-page-header__title">Referrals</div>
          <div className="pw-page-header__subtitle">Grow your network, earn more points</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="pw-metric-row">
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--blue">{directCount}</div>
          <div className="pw-metric__label">Direct</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--purple">{networkCount}</div>
          <div className="pw-metric__label">Network</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--green">{data.total_referral_earnings ?? 0}</div>
          <div className="pw-metric__label">Pts Earned</div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="pw-section pw-section--padded">
        <div className="pw-tab-toggle">
          <button
            className={`pw-tab-toggle__btn ${tab === 'referrals' ? 'pw-tab-toggle__btn--active' : ''}`}
            onClick={() => setTab('referrals')}
            type="button"
          >
            My Referrals
            <span className="pw-tab-toggle__badge">{directCount}</span>
          </button>
          <button
            className={`pw-tab-toggle__btn ${tab === 'network' ? 'pw-tab-toggle__btn--active' : ''}`}
            onClick={() => setTab('network')}
            type="button"
          >
            Network
            <span className="pw-tab-toggle__badge">{networkCount}</span>
          </button>
        </div>

        {tab === 'referrals' && (
          <ReferralLinkSection
            refUrl={refUrl}
            directCount={directCount}
            directReferrals={directReferrals}
            discountPercent={String(settings?.referral_discount_percent || '5')}
            referrerPoints={levelEarn[0]?.match(/\d+/)?.[0] || '5'}
          />
        )}

        {tab === 'network' && (
          <NetworkTreeSection
            downlineTree={downlineTree}
            totalDescendants={totalDescendants}
            directCount={directCount}
            referralCode={data.referral_code}
            treeGen={treeGen}
            levelLabels={levelLabels}
            levelEarn={levelEarn}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        )}
      </div>
    </div>
  );
}
