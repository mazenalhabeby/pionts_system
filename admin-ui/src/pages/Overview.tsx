import { useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart as RechartsArea, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { dashboardApi, analyticsApi, partnersApi } from '../api';
import { useProject } from '../context/ProjectContext';
import { useFetch } from '@pionts/shared';
import ActivityFeed from '../components/ActivityFeed';
import type { PointsLogEntry, PointsEconomyBucket, CustomerSegments } from '@pionts/shared';
import { Alert } from '../components/ui/alert';
import { NoProject } from '../components/ui/empty-state';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));
const fmtDate = (d: string) => { const dt = new Date(d); return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`; };

/* ── Rank Badge ── */
const RANK_COLORS = ['#ff3c00', '#0ea5e9', '#6366f1', '#a855f7', '#64748b'];

function RankBadge({ rank }: { rank: number }) {
  const bg = RANK_COLORS[rank - 1] || '#555';
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-bold shrink-0" style={{ background: bg }}>
      {rank}
    </span>
  );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg px-3 py-2 shadow-lg text-[12px]">
      <div className="text-text-faint mb-1.5 font-medium">{fmtDate(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted">{p.dataKey === 'issued' ? 'Issued' : 'Redeemed'}</span>
          <span className="font-bold text-text-primary ml-auto">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Points Economy Chart (Recharts) ── */
function PointsChart({ buckets }: { buckets: PointsEconomyBucket[] }) {
  if (buckets.length < 2) {
    return <div className="text-center text-text-muted py-10 text-[13px]">Not enough data yet</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff3c00' }} />
          <span className="text-[12px] text-text-muted font-medium">Issued</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />
          <span className="text-[12px] text-text-muted font-medium">Redeemed</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <RechartsArea data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="grad-issued" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3c00" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ff3c00" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-redeemed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.2)' }} />
          <Area
            type="monotone"
            dataKey="issued"
            stroke="#ff3c00"
            strokeWidth={2.5}
            fill="url(#grad-issued)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-card, #111)' }}
          />
          <Area
            type="monotone"
            dataKey="redeemed"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#grad-redeemed)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--color-bg-card, #111)' }}
          />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Customer Segments Donut (Recharts) ── */
const SEGMENT_COLORS = ['#50e3c2', '#f5a623', '#ee5555'];

function SegmentsDonut({ segments }: { segments: CustomerSegments }) {
  const total = segments.active + segments.at_risk + segments.churned;

  const data = [
    { name: 'Active', value: segments.active, color: '#50e3c2' },
    { name: 'At Risk', value: segments.at_risk, color: '#f5a623' },
    { name: 'Churned', value: segments.churned, color: '#ee5555' },
  ];

  if (total === 0) {
    return <div className="text-center text-text-muted py-10 text-[13px]">No customer data</div>;
  }

  return (
    <div className="flex items-center gap-6 justify-center py-2">
      <div className="shrink-0" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={58}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SEGMENT_COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <div>
              <div className="text-[12px] text-text-muted">{d.name}</div>
              <div className="text-[16px] font-bold text-text-primary leading-tight">
                {d.value.toLocaleString()}
                <span className="text-[11px] font-normal text-text-faint ml-1">
                  ({((d.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tabbed Section ── */
type TabId = 'activity' | 'referrers' | 'partners';

function OverviewTabs({ recentActivity, topReferrers, topPartners, showReferrers, showPartners }: {
  recentActivity: PointsLogEntry[];
  topReferrers: any[];
  topPartners: any[];
  showReferrers: boolean;
  showPartners: boolean;
}) {
  const tabs: { id: TabId; label: string; count: number; link?: { to: string; text: string } }[] = [
    { id: 'activity', label: 'Recent Activity', count: recentActivity.length },
    ...(showReferrers ? [{ id: 'referrers' as const, label: 'Top Referrers', count: topReferrers.length, link: { to: '/referrals', text: 'View all' } }] : []),
    ...(showPartners ? [{ id: 'partners' as const, label: 'Top Partners', count: topPartners.length, link: { to: '/partners', text: 'View all' } }] : []),
  ];

  const [active, setActive] = useState<TabId>('activity');
  const current = tabs.find(t => t.id === active) || tabs[0];

  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-default">
        <span className="text-[13px] font-bold text-text-primary tracking-wide">Activity</span>
      </div>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border-default px-5">
        <div className="flex items-center gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`relative px-4 py-3.5 text-[13px] font-medium transition-colors bg-transparent border-none cursor-pointer font-sans ${
                active === tab.id
                  ? 'text-text-primary'
                  : 'text-text-faint hover:text-text-secondary'
              }`}
            >
              {tab.label}
              {active === tab.id && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {current?.link && current.count > 0 && (
            <Link to={current.link.to} className="text-[12px] font-medium text-primary no-underline hover:underline">
              {current.link.text}
            </Link>
          )}
          <span className="text-[11px] font-medium text-text-faint bg-bg-surface px-2 py-0.5 rounded-md">
            {current?.count ?? 0}
          </span>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
        {active === 'activity' && <ActivityFeed activities={recentActivity} />}

        {active === 'referrers' && (
          topReferrers.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-text-muted">No referrers yet</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {topReferrers.map((ref: any, idx: number) => (
                <div key={ref.id || idx} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-surface-hover/30 transition-colors">
                  <RankBadge rank={idx + 1} />
                  <div className="w-8 h-8 rounded-full bg-bg-surface-raised flex items-center justify-center text-[12px] font-bold text-text-muted shrink-0">
                    {(ref.name || ref.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/customer/${ref.id}`} className="text-[13px] font-medium text-text-primary no-underline hover:text-primary truncate block">
                      {ref.name || ref.email}
                    </Link>
                    <div className="text-[11px] text-text-faint mt-0.5">
                      {ref.direct || 0} direct &middot; {ref.network || 0} network
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-bold text-success">{(ref.points_earned_total || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-text-faint">pts</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {active === 'partners' && (
          topPartners.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-text-muted">No partners yet</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {topPartners.map((p: any, idx: number) => (
                <div key={p.id || idx} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-surface-hover/30 transition-colors">
                  <RankBadge rank={idx + 1} />
                  <div className="w-8 h-8 rounded-full bg-bg-surface-raised flex items-center justify-center text-[12px] font-bold text-text-muted shrink-0">
                    {(p.name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/customer/${p.id}`} className="text-[13px] font-medium text-text-primary no-underline hover:text-primary truncate block">
                      {p.name || p.email}
                    </Link>
                    <div className="text-[11px] text-text-faint mt-0.5">
                      {p.commission_pct}% commission
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-bold text-success">{Number(p.total_earned || 0).toFixed(2)}</div>
                    <div className="text-[10px] text-text-faint">earned</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Overview() {
  const { currentProject } = useProject();
  const pid = currentProject?.id;

  const { data, loading, error } = useFetch(
    useCallback(() => dashboardApi.getStats(pid!), [pid]),
    [pid],
  );

  const { data: chartData } = useFetch(
    useCallback(() => analyticsApi.getPointsEconomy(pid!, 'day'), [pid]),
    [pid],
  );

  const { data: segmentsData } = useFetch(
    useCallback(() => analyticsApi.getSegments(pid!), [pid]),
    [pid],
  );

  const { data: partnersData } = useFetch(
    useCallback(() => currentProject?.partnersEnabled ? partnersApi.list(pid!) : Promise.resolve([]), [pid, currentProject?.partnersEnabled]),
    [pid, currentProject?.partnersEnabled],
  );
  const topPartners: any[] = (partnersData || []).slice(0, 5);

  if (!pid) return <NoProject />;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading overview...</div>;
  if (error) return <Alert>{error}</Alert>;
  if (!data) return null;

  const stats = data.stats || {};
  const recentActivity: PointsLogEntry[] = data.recentActivity || [];
  const topReferrers: any[] = data.topReferrers || [];
  const buckets: PointsEconomyBucket[] = chartData?.buckets || [];
  const segments: CustomerSegments = segmentsData || { active: 0, at_risk: 0, churned: 0 };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero with stats ── */}
      <div className="ov-hero bg-bg-card border border-border-default rounded-2xl relative overflow-hidden">
        <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6">
          <div className="text-[11px] text-primary uppercase tracking-[2px] font-bold">Dashboard</div>
          <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">{currentProject.name}</div>
          {currentProject.domain && (
            <div className="text-[13px] text-text-muted mt-1">{currentProject.domain}</div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 border-t border-border-default max-md:grid-cols-2">
          {[
            { label: 'Total Members', value: (stats.totalCustomers || 0).toLocaleString() },
            { label: 'Total Orders', value: (stats.totalOrders || 0).toLocaleString() },
            { label: 'Points Issued', value: (stats.totalPoints || 0).toLocaleString() },
            { label: 'Redeemed', value: `\u20AC${stats.totalRedeemed || 0}`, accent: true },
          ].map((s, i) => (
            <div key={s.label} className={`px-8 py-5 max-md:px-5 max-md:py-4 ${i > 0 ? 'border-l border-border-default max-md:border-l-0' : ''} ${i >= 2 ? 'max-md:border-t max-md:border-border-default' : ''} ${i % 2 !== 0 ? 'max-md:border-l max-md:border-border-default' : ''}`}>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">{s.label}</div>
              <div className={`text-[22px] font-bold leading-none ${s.accent ? 'text-success' : 'text-text-primary'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-[1fr_340px] gap-5 items-stretch max-[900px]:grid-cols-1">
        {/* Points Economy Chart */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
            <div className="text-[14px] font-semibold text-text-primary">Points Economy</div>
            <span className="text-[11px] text-text-faint">Last 30 days</span>
          </div>
          <div className="p-4 flex-1">
            <PointsChart buckets={buckets} />
          </div>
        </div>

        {/* Customer Segments */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
            <div className="text-[14px] font-semibold text-text-primary">Customer Health</div>
            <Link to="/analytics" className="text-[12px] font-medium text-primary no-underline hover:underline">Details</Link>
          </div>
          <div className="p-4 flex-1 flex items-center justify-center">
            <SegmentsDonut segments={segments} />
          </div>
        </div>
      </div>

      {/* ── Tabbed: Activity / Referrers / Partners ── */}
      <OverviewTabs
        recentActivity={recentActivity}
        topReferrers={topReferrers}
        topPartners={topPartners}
        showReferrers={currentProject?.referralsEnabled !== false}
        showPartners={!!currentProject?.partnersEnabled}
      />
    </div>
  );
}
