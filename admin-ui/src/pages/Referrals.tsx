import { useMemo, useCallback } from 'react';
import { dashboardApi, referralLevelsApi } from '../api';
import { useProject } from '../context/ProjectContext';
import { useFetch } from '@pionts/shared';
import ReferralTree, { countAllLevels } from '../components/ReferralTree';
import { LEVEL_COLORS } from '../components/referral-tree/level-colors';
import { Alert } from '../components/ui/alert';
import { NoProject } from '../components/ui/empty-state';

export default function Referrals() {
  const { currentProject } = useProject();
  const pid = currentProject?.id;
  const { data, loading, error } = useFetch(
    useCallback(() => dashboardApi.getReferrals(pid!), [pid]),
    [pid],
  );
  const { data: refLevels } = useFetch(
    useCallback(() => referralLevelsApi.list(pid!), [pid]),
    [pid],
  );
  const trees = data?.trees || [];

  // Build level→points map from config
  const levelPoints = useMemo(() => {
    const map: Record<number, number> = {};
    if (Array.isArray(refLevels)) {
      for (const l of refLevels) map[l.level] = l.points;
    }
    return map;
  }, [refLevels]);

  const maxLevels = useMemo(() => {
    const keys = Object.keys(levelPoints).map(Number);
    return keys.length > 0 ? Math.max(...keys) : 3;
  }, [levelPoints]);

  const levels = useMemo(() => countAllLevels(trees, maxLevels), [trees, maxLevels]);

  const totalDirect = levels[0] || 0;
  const totalIndirect = useMemo(() => levels.slice(1).reduce((s, n) => s + n, 0), [levels]);

  if (!pid) return <NoProject />;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading referral network...</div>;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero with stats */}
      <div className="page-hero referrals-hero bg-bg-card border border-border-default rounded-2xl">
        <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6">
          <div className="text-[11px] uppercase tracking-[2px] font-bold" style={{ color: '#0a8a5a' }}>Network</div>
          <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Referral Network</div>
          <div className="text-[13px] text-text-muted mt-1">Visualize your crew's referral chains</div>
        </div>

        <div className="grid grid-cols-4 border-t border-border-default max-sm:grid-cols-2">
          {[
            { label: 'Chains', value: data?.totalChains || 0 },
            { label: 'Total Members', value: data?.totalMembers || 0 },
            { label: 'Direct', value: totalDirect },
            { label: 'Indirect', value: totalIndirect },
          ].map((s, i) => (
            <div key={s.label} className={`px-6 py-5 max-md:px-4 max-md:py-4 ${i > 0 ? 'border-l border-border-default max-sm:border-l-0' : ''} ${i >= 2 ? 'max-sm:border-t max-sm:border-border-default' : ''} ${i % 2 !== 0 ? 'max-sm:border-l max-sm:border-border-default' : ''}`}>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">{s.label}</div>
              <div className="text-[22px] font-bold leading-none text-text-primary max-md:text-lg">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Per-level breakdown */}
        <div className="flex items-center gap-3 flex-wrap px-8 py-3.5 border-t border-border-default max-md:px-5">
          {levels.map((count, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LEVEL_COLORS[i % LEVEL_COLORS.length].dot }} />
              <span className="text-[12px] font-bold text-text-secondary">{count}</span>
              <span className="text-[11px] text-text-faint">{i === 0 ? 'L1 Direct' : `L${i + 1}`}</span>
              {levelPoints[i + 1] != null && (
                <span className="text-[10px] text-text-faint font-mono">({levelPoints[i + 1]} pts)</span>
              )}
            </div>
          ))}
          <span className="ml-auto text-[11px] text-text-faint">Deepest: <span className="font-bold text-text-secondary">{Math.min(data?.deepest || 0, maxLevels)}</span></span>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-border-default">
          <div className="text-[14px] font-semibold text-text-primary">Network Tree</div>
          <span className="text-[11px] font-medium text-text-faint bg-bg-surface px-2 py-0.5 rounded-md">{data?.totalMembers || 0} members</span>
        </div>
        <div className="p-5">
          <ReferralTree trees={trees} levelPoints={levelPoints} />
        </div>
      </div>
    </div>
  );
}
