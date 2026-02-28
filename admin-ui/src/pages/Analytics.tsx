import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { analyticsApi, dashboardApi } from '../api';
import type { PointsEconomyBucket, ReferralFunnelData, CustomerSegments as SegmentsType } from '@pionts/shared';
import PointsEconomyChart from './analytics/PointsEconomyChart';
import ReferralFunnel from './analytics/ReferralFunnel';
import CustomerSegments from './analytics/CustomerSegments';
import ExportButtons from './analytics/ExportButtons';
import { NoProject } from '../components/ui/empty-state';

type Period = 'day' | 'week' | 'month';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

interface Insight {
  text: string;
  sub: string;
  color: string;
  to: string;
}

export default function Analytics() {
  const { currentProject } = useProject();
  const [period, setPeriod] = useState<Period>('day');
  const [economy, setEconomy] = useState<PointsEconomyBucket[]>([]);
  const [funnel, setFunnel] = useState<ReferralFunnelData | null>(null);
  const [segments, setSegments] = useState<SegmentsType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingEconomy, setLoadingEconomy] = useState(true);
  const [loadingStatic, setLoadingStatic] = useState(true);

  useEffect(() => {
    if (!currentProject) return;
    setLoadingStatic(true);
    Promise.all([
      analyticsApi.getReferralFunnel(currentProject.id),
      analyticsApi.getSegments(currentProject.id),
      dashboardApi.getStats(currentProject.id),
    ])
      .then(([funnelRes, segmentsRes, statsRes]) => {
        setFunnel(funnelRes);
        setSegments(segmentsRes);
        setStats(statsRes.stats || {});
      })
      .finally(() => setLoadingStatic(false));
  }, [currentProject]);

  useEffect(() => {
    if (!currentProject) return;
    setLoadingEconomy(true);
    analyticsApi.getPointsEconomy(currentProject.id, period)
      .then((res) => setEconomy(res.buckets || []))
      .finally(() => setLoadingEconomy(false));
  }, [currentProject, period]);

  if (!currentProject) return <NoProject />;

  const loading = loadingEconomy && loadingStatic;
  if (loading) {
    return <div className="text-center text-text-muted py-10">Loading analytics...</div>;
  }

  const totalIssued = stats?.totalPoints || 0;
  const totalRedeemed = stats?.totalRedeemed || 0;
  const totalUnused = totalIssued - totalRedeemed;
  const engagementPct = totalIssued > 0 ? ((totalRedeemed / totalIssued) * 100).toFixed(1) : '0';
  const totalCustomers = stats?.totalCustomers || 0;
  const activeCustomers = segments ? segments.active : 0;
  const atRiskCustomers = segments ? segments.at_risk : 0;

  const insights: Insight[] = [];
  if (segments && totalCustomers > 0) {
    if (atRiskCustomers > 0) {
      insights.push({
        text: `${atRiskCustomers} customer${atRiskCustomers !== 1 ? 's' : ''} might leave`,
        sub: 'Inactive 30-90 days',
        color: '#f5a623',
        to: '/customers?segment=at_risk',
      });
    }
    if (Number(engagementPct) < 20 && totalIssued > 0) {
      insights.push({
        text: `Low reward usage (${engagementPct}%)`,
        sub: 'Adjust thresholds',
        color: '#6366f1',
        to: '/settings',
      });
    }
    if (totalUnused > 100) {
      insights.push({
        text: `${totalUnused.toLocaleString()} unused points`,
        sub: 'See top balances',
        color: '#ff3c00',
        to: '/customers?segment=has_balance',
      });
    }
    if (funnel && funnel.referredSignups > 0 && funnel.referredPurchasers === 0) {
      insights.push({
        text: "Referred aren't buying",
        sub: 'View referrals',
        color: '#f5a623',
        to: '/referrals',
      });
    }
    if (Number(engagementPct) >= 20 && totalIssued > 0) {
      insights.push({
        text: `Good engagement (${engagementPct}%)`,
        sub: 'Keep it up',
        color: '#50e3c2',
        to: '/customers',
      });
    }
  }

  const heroStats = [
    { label: 'Members', value: totalCustomers.toLocaleString(), desc: 'Total customers in your program', color: 'text-text-primary', glow: 'rgba(237,237,237,0.15)' },
    { label: 'Active Now', value: activeCustomers.toLocaleString(), desc: 'Engaged in the last 30 days', color: 'text-success', glow: 'rgba(80,227,194,0.3)' },
    { label: 'Need Attention', value: atRiskCustomers.toLocaleString(), desc: 'Haven\'t visited in 30-90 days', color: 'text-warning', glow: 'rgba(245,166,35,0.3)' },
    { label: 'Points Given', value: totalIssued.toLocaleString(), desc: 'Total points earned by customers', color: 'text-accent', glow: 'rgba(255,60,0,0.3)' },
    { label: 'Points Used', value: totalRedeemed.toLocaleString(), desc: 'Points spent on rewards', color: 'text-[#6366f1]', glow: 'rgba(99,102,241,0.3)' },
    { label: 'Engagement', value: `${engagementPct}%`, desc: 'How often points get redeemed', color: engagementPct === '0' ? 'text-text-faint' : Number(engagementPct) > 30 ? 'text-success' : 'text-warning', glow: Number(engagementPct) > 30 ? 'rgba(80,227,194,0.3)' : 'rgba(245,166,35,0.3)' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero ── */}
      <div className="page-hero analytics-hero bg-bg-card border border-border-default rounded-2xl relative overflow-hidden">
        <div className="px-8 pt-7 pb-4 max-md:px-5 max-md:pt-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-[2px] font-bold text-success">Insights</div>
            <div className="text-[28px] font-extrabold text-text-primary leading-tight mt-1 tracking-[-0.02em] max-md:text-[22px]">How your program is doing</div>
            <div className="text-[13px] text-text-muted mt-1">See how customers engage with your loyalty program</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportButtons projectId={currentProject.id} />
            <div className="flex bg-bg-surface-raised rounded-lg p-0.5 border border-border-default">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3.5 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200 border-none cursor-pointer font-sans ${
                    period === opt.value
                      ? 'bg-text-primary text-bg-page shadow-sm'
                      : 'text-text-faint bg-transparent hover:text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-6 border-t border-border-default max-lg:grid-cols-3 max-sm:grid-cols-2">
          {heroStats.map((s, i) => (
            <div key={s.label} className={`px-6 py-5 max-md:px-4 max-md:py-4 ${i > 0 ? 'border-l border-border-default max-sm:border-l-0' : ''} ${i >= 3 ? 'max-lg:border-t max-lg:border-border-default' : ''} ${i % 2 !== 0 ? 'max-sm:border-l max-sm:border-border-default' : ''} ${i >= 2 ? 'max-sm:border-t max-sm:border-border-default' : ''}`}>
              <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-text-faint mb-1.5">{s.label}</div>
              <div className={`text-[20px] font-extrabold leading-none tabular-nums ${s.color}`} style={{ textShadow: `0 0 16px ${s.glow}` }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Insights ── */}
      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {insights.map((item) => (
            <Link
              key={item.text}
              to={item.to}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-bg-card border border-border-default rounded-lg no-underline transition-all duration-200 hover:border-border-focus/50 hover:bg-bg-surface-hover/30 group"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}50` }} />
              <span className="text-[12px] font-semibold text-text-primary">{item.text}</span>
              <span className="text-[11px] text-text-faint hidden sm:inline">{item.sub}</span>
              <span className="text-[11px] text-text-faint group-hover:text-primary transition-colors">&rarr;</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Points Over Time ── */}
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-[13px] font-bold text-text-primary tracking-wide">Points Over Time</div>
            <div className="flex items-center gap-5">
              <div>
                <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Issued</div>
                <div className="text-[15px] font-extrabold text-success tabular-nums leading-tight">{totalIssued.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Redeemed</div>
                <div className="text-[15px] font-extrabold text-[#6366f1] tabular-nums leading-tight">{totalRedeemed.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] text-text-faint uppercase tracking-[0.1em] font-semibold">Net</div>
                <div className={`text-[15px] font-extrabold tabular-nums leading-tight ${totalUnused >= 0 ? 'text-text-primary' : 'text-[#ee5555]'}`}>{totalUnused >= 0 ? '+' : ''}{totalUnused.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md shrink-0">
            {period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly'}
          </span>
        </div>
        <div className="p-5">
          <PointsEconomyChart buckets={economy} />
        </div>
      </div>

      {/* ── Referrals + Customer Health ── */}
      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-default">
            <div className="text-[13px] font-bold text-text-primary tracking-wide">Referral Funnel</div>
          </div>
          <div className="p-5">
            {funnel ? <ReferralFunnel data={funnel} /> : <div className="text-center py-10 text-[13px] text-text-muted">No data yet</div>}
          </div>
        </div>

        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-default">
            <div className="text-[13px] font-bold text-text-primary tracking-wide">Customer Health</div>
          </div>
          <div className="p-5">
            {segments ? <CustomerSegments data={segments} /> : <div className="text-center py-10 text-[13px] text-text-muted">No data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
