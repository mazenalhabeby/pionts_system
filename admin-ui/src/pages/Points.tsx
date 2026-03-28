import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, analyticsApi, earnActionsApi, redemptionTiersApi } from '../api';
import { useProject } from '../context/ProjectContext';
import { useFetch, formatPoints } from '@pionts/shared';
import ActivityFeed from '../components/ActivityFeed';
import PointsEconomyChart from '../components/charts/PointsEconomyChart';
import CardSection from '../components/ui/CardSection';
import PageHero from '../components/ui/PageHero';
import type { PointsLogEntry, PointsEconomyBucket, EarnAction, RedemptionTier } from '@pionts/shared';
import { Alert } from '../components/ui/alert';
import { NoProject } from '../components/ui/empty-state';

const PERIODS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  predefined: 'Core',
  social_follow: 'Social',
  custom: 'Custom',
};

/* ── Earn Actions Tabbed Card ── */

type EarnTabId = 'one_time' | 'repeatable' | 'custom';

function EarnActionsCard({ actions }: { actions: EarnAction[] }) {
  const oneTime = actions.filter(a => a.category !== 'custom' && a.frequency === 'one_time');
  const repeatable = actions.filter(a => a.category !== 'custom' && (a.frequency === 'repeatable' || a.frequency === 'yearly'));
  const custom = actions.filter(a => a.category === 'custom');

  const tabs: { id: EarnTabId; label: string; items: EarnAction[] }[] = [
    { id: 'one_time', label: 'One-time', items: oneTime },
    { id: 'repeatable', label: 'Repeatable', items: repeatable },
    ...(custom.length > 0 ? [{ id: 'custom' as const, label: 'Custom', items: custom }] : []),
  ];

  const [active, setActive] = useState<EarnTabId>('one_time');
  const currentTab = tabs.find(t => t.id === active) || tabs[0];

  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default">
        <div className="text-[14px] font-semibold text-text-primary">Earn Actions</div>
        <Link to="/settings" className="text-[12px] font-medium text-primary no-underline hover:underline">
          Configure &rarr;
        </Link>
      </div>
      <div className="flex items-center justify-between border-b border-border-default px-1">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`relative px-4 py-3.5 text-[13px] font-medium transition-all duration-200 bg-transparent border-none cursor-pointer font-sans ${
                currentTab.id === tab.id ? 'text-text-primary' : 'text-text-faint hover:text-text-secondary'
              }`}
            >
              {tab.label}
              {tab.items.length > 0 && (
                <span className={`ml-1.5 text-[11px] tabular-nums ${currentTab.id === tab.id ? 'text-text-muted' : 'text-text-faint'}`}>
                  {tab.items.length}
                </span>
              )}
              {currentTab.id === tab.id && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>
      {currentTab.items.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-text-muted">
          {currentTab.id === 'custom' ? 'No custom actions configured' : 'No actions in this category'}
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {currentTab.items.map((action) => (
            <div key={action.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-surface-hover/30 transition-colors duration-150">
              <span className={`w-2 h-2 rounded-full shrink-0 ${action.enabled ? 'bg-success' : 'bg-text-faint'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-text-secondary truncate">{action.label}</div>
                <div className="text-[11px] text-text-faint mt-0.5">
                  {CATEGORY_LABELS[action.category] || action.category}
                  {action.frequency === 'yearly' && <> &middot; Yearly</>}
                </div>
              </div>
              <span className="text-[14px] font-bold text-text-primary shrink-0 tabular-nums">
                {formatPoints(action.points)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function Points() {
  const { currentProject } = useProject();
  const pid = currentProject?.id;
  const [period, setPeriod] = useState<string>('day');

  const { data: statsData, loading, error } = useFetch(
    useCallback(() => dashboardApi.getStats(pid!), [pid]),
    [pid],
  );

  const { data: chartData } = useFetch(
    useCallback(() => analyticsApi.getPointsEconomy(pid!, period), [pid, period]),
    [pid, period],
  );

  const { data: earnActions } = useFetch(
    useCallback(() => earnActionsApi.list(pid!), [pid]),
    [pid],
  );

  const { data: tiers } = useFetch(
    useCallback(() => redemptionTiersApi.list(pid!), [pid]),
    [pid],
  );

  if (!pid) return <NoProject />;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading points...</div>;
  if (error) return <Alert>{error}</Alert>;
  if (!statsData) return null;

  const stats = statsData.stats || {};
  const recentActivity: PointsLogEntry[] = statsData.recentActivity || [];
  const buckets: PointsEconomyBucket[] = chartData?.buckets || [];
  const actions: EarnAction[] = earnActions || [];
  const redemptionTiers: RedemptionTier[] = tiers || [];

  const totalIssued = stats.totalPoints || 0;
  const totalRedeemed = stats.totalRedeemed || 0;
  const totalBalance = totalIssued - totalRedeemed;
  const redemptionRate = totalIssued > 0 ? ((totalRedeemed / totalIssued) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero ── */}
      <PageHero
        label="Loyalty Program"
        labelColor="#f5a623"
        title="Points Overview"
        subtitle="Track your loyalty program performance and configuration"
        className="page-hero points-hero"
        stats={[
          { label: 'Points Issued', value: totalIssued.toLocaleString() },
          { label: 'Points Redeemed', value: totalRedeemed.toLocaleString() },
          { label: 'Outstanding Balance', value: totalBalance.toLocaleString() },
          { label: 'Redemption Rate', value: `${redemptionRate}%`, accent: true },
        ]}
      />

      {/* ── Points Economy Chart ── */}
      <CardSection
        title="Points Economy"
        action={
          <div className="flex items-center gap-1 bg-bg-surface rounded-lg p-0.5 border border-border-default">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors border-none cursor-pointer font-sans ${
                  period === p.value
                    ? 'bg-bg-surface-raised text-text-primary shadow-sm'
                    : 'bg-transparent text-text-faint hover:text-text-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="p-4">
          <PointsEconomyChart buckets={buckets} issuedColor="#f5a623" gradientId="pts" />
        </div>
      </CardSection>

      {/* ── Earn Actions + Redemption Tiers ── */}
      <div className="grid grid-cols-[1fr_1fr] gap-5 items-start max-[900px]:grid-cols-1">
        {/* Earn Actions */}
        <EarnActionsCard actions={actions} />

        {/* Redemption Tiers */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-border-default">
            <div className="text-[14px] font-semibold text-text-primary">Redemption Tiers</div>
            <Link to="/settings" className="text-[12px] font-medium text-primary no-underline hover:underline">
              Configure &rarr;
            </Link>
          </div>
          {redemptionTiers.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-text-muted">No redemption tiers configured</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {redemptionTiers.map((tier) => (
                <div key={tier.id || tier.points} className="flex items-center justify-between px-5 py-3 hover:bg-bg-surface-hover/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-warning-dim flex items-center justify-center text-[12px] font-bold text-warning shrink-0">
                      {tier.points}
                    </span>
                    <div className="text-[13px] text-text-secondary">
                      {tier.points} points
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-success shrink-0">
                    &euro;{tier.discount} off
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Points Activity ── */}
      <CardSection title="Recent Points Activity" badge={recentActivity.length}>
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          <ActivityFeed activities={recentActivity} />
        </div>
      </CardSection>
    </div>
  );
}
