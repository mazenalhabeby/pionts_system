import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { partnersApi, getErrorMessage } from '../api';
import type { PartnerListItem } from '@pionts/shared';
import { NoProject } from '../components/ui/empty-state';
import { Alert } from '../components/ui/alert';

const RANK_COLORS = ['#ff3c00', '#0ea5e9', '#6366f1', '#a855f7', '#64748b'];

export default function Partners() {
  const { currentProject } = useProject();
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const data = await partnersApi.list(currentProject.id);
      setPartners(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => { load(); }, [load]);

  if (!currentProject) return <NoProject />;

  const totalEarned = partners.reduce((sum, p) => sum + Number(p.total_earned || 0), 0);
  const avgCommission = partners.length > 0
    ? (partners.reduce((sum, p) => sum + (p.commission_pct || 0), 0) / partners.length).toFixed(1)
    : '0';
  const activePartners = partners.filter((p) => Number(p.total_orders || 0) > 0).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero partners-hero bg-bg-card border border-border-default rounded-2xl">
        <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6">
          <div className="flex items-center gap-3">
            <div className="text-[11px] uppercase tracking-[2px] font-bold" style={{ color: '#0ea5e9' }}>Partners</div>
            <span className="text-[11px] font-medium text-text-faint bg-bg-surface px-2 py-0.5 rounded-md">{partners.length}</span>
          </div>
          <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Partner Program</div>
          <div className="text-[13px] text-text-muted mt-1">Admin-promoted customers who earn commission on referrals</div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 border-t border-border-default max-md:grid-cols-2">
          {[
            { label: 'Total Partners', value: String(partners.length) },
            { label: 'Total Earned', value: `\u20AC${totalEarned.toFixed(2)}`, accent: true },
            { label: 'Avg Commission', value: `${avgCommission}%` },
            { label: 'Active Partners', value: String(activePartners) },
          ].map((s, i) => (
            <div key={s.label} className={`px-8 py-5 max-md:px-5 max-md:py-4 ${i > 0 ? 'border-l border-border-default max-md:border-l-0' : ''} ${i >= 2 ? 'max-md:border-t max-md:border-border-default' : ''} ${i % 2 !== 0 ? 'max-md:border-l max-md:border-border-default' : ''}`}>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">{s.label}</div>
              <div className={`text-[22px] font-bold leading-none ${s.accent ? 'text-success' : 'text-text-primary'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Partners list */}
      {loading ? (
        <div className="text-center p-10 text-text-muted">Loading partners...</div>
      ) : partners.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="text-[40px] mb-3">&#129309;</div>
            <div className="text-[15px] font-semibold text-text-primary mb-1">No partners yet</div>
            <div className="text-[13px] text-text-muted mb-4">Promote customers to partners from their detail page.</div>
            <Link to="/customers" className="text-[13px] font-semibold text-primary no-underline hover:underline">
              Browse customers &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-border-default">
            <div className="text-[14px] font-semibold text-text-primary">All Partners</div>
            <span className="text-[11px] font-medium text-text-faint bg-bg-surface px-2 py-0.5 rounded-md">{partners.length}</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-border-subtle">
            {partners.map((p, idx) => (
              <Link
                key={p.id}
                to={`/customer/${p.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-surface-hover/30 transition-colors no-underline"
              >
                {/* Rank badge for top 5 */}
                {idx < 5 ? (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-bold shrink-0"
                    style={{ background: RANK_COLORS[idx] }}
                  >
                    {idx + 1}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-text-faint text-[11px] font-bold shrink-0 bg-bg-surface">
                    {idx + 1}
                  </span>
                )}

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-bg-surface-raised flex items-center justify-center text-[12px] font-bold text-text-muted shrink-0">
                  {(p.name || p.email || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary truncate">
                    {p.name || p.email}
                  </div>
                  <div className="text-[11px] text-text-faint mt-0.5 truncate">{p.email}</div>
                </div>

                {/* Commission badge */}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)' }}>
                  {p.commission_pct}%
                </span>

                {/* Earnings */}
                <div className="text-right shrink-0 min-w-[80px]">
                  <div className="text-[14px] font-bold text-success">{Number(p.total_earned || 0).toFixed(2)}</div>
                  <div className="text-[10px] text-text-faint">earned</div>
                </div>

                {/* Orders */}
                <div className="text-right shrink-0 min-w-[48px]">
                  <div className="text-[13px] font-semibold text-text-secondary">{p.total_orders}</div>
                  <div className="text-[10px] text-text-faint">orders</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
