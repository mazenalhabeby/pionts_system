import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dashboardApi, orgApi, analyticsApi } from '../api';
import { useProject } from '../context/ProjectContext';
import { useFetch, useDebounce, timeAgo } from '@pionts/shared';
import { Alert } from '../components/ui/alert';
import { Pagination } from '../components/ui/pagination';

const PAGE_SIZE = 20;

type Segment = 'all' | 'active' | 'at_risk' | 'churned' | 'has_balance';

const SEGMENT_OPTIONS: { value: Segment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'churned', label: 'Churned' },
  { value: 'has_balance', label: 'Has Balance' },
];

interface SortIconProps {
  active: boolean;
  dir: string;
}

function SortIcon({ active, dir }: SortIconProps) {
  if (!active) return <span className="text-[10px] ml-1 text-text-faint">{'\u2195'}</span>;
  return <span className="text-[10px] ml-1 text-primary">{dir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
}

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentProject, projects } = useProject();
  const pid = currentProject?.id;

  const initialSegment = (searchParams.get('segment') as Segment) || 'all';
  const [segment, setSegment] = useState<Segment>(
    SEGMENT_OPTIONS.some((o) => o.value === initialSegment) ? initialSegment : 'all',
  );
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(searchParams.get('sort') || 'points_balance');
  const [sortDir, setSortDir] = useState(searchParams.get('dir') || 'desc');
  const [page, setPage] = useState(1);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number> | null>(null);

  const debouncedSearch = useDebounce(search);

  // Fetch segment counts when project changes
  useEffect(() => {
    if (!pid) { setSegmentCounts(null); return; }
    analyticsApi.getSegments(pid).then((res) => {
      setSegmentCounts({ active: res.active, at_risk: res.at_risk, churned: res.churned });
    }).catch(() => setSegmentCounts(null));
  }, [pid]);

  // Build a project name lookup from all projects
  const projectNameMap: Record<number, string> = {};
  for (const p of projects) {
    projectNameMap[p.id] = p.name;
  }

  // Determine the effective segment: if searching, fall back to 'all'
  const effectiveSegment = debouncedSearch ? 'all' : segment;

  const fetchCustomers = useCallback(() => {
    // Segment endpoints only work with a project selected
    if (pid && (effectiveSegment === 'active' || effectiveSegment === 'at_risk' || effectiveSegment === 'churned')) {
      return analyticsApi.getSegmentCustomers(pid, effectiveSegment, PAGE_SIZE, (page - 1) * PAGE_SIZE);
    }

    const params: Record<string, string | number> = {
      q: debouncedSearch,
      sort: effectiveSegment === 'has_balance' ? 'points_balance' : sortKey,
      dir: effectiveSegment === 'has_balance' ? 'desc' : sortDir,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    };
    if (pid) {
      return dashboardApi.getCustomers(pid, params);
    }
    return orgApi.getCustomers(params);
  }, [pid, debouncedSearch, sortKey, sortDir, page, effectiveSegment]);

  const { data, loading, error } = useFetch(fetchCustomers, [pid, debouncedSearch, sortKey, sortDir, page, effectiveSegment]);

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleSegmentChange(newSegment: Segment) {
    setSegment(newSegment);
    setPage(1);
    // Update URL params
    const next = new URLSearchParams(searchParams);
    if (newSegment === 'all') {
      next.delete('segment');
    } else {
      next.set('segment', newSegment);
    }
    setSearchParams(next, { replace: true });
  }

  // Table title based on segment
  const segmentLabel = SEGMENT_OPTIONS.find((o) => o.value === effectiveSegment)?.label || 'All';
  const tableTitle = effectiveSegment === 'all' ? 'All Customers' : `${segmentLabel} Customers`;

  const colSpan = pid ? 5 : 6;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="page-hero customers-hero bg-bg-card border border-border-default rounded-2xl">
        <div className="px-8 pt-8 pb-6 max-md:px-5 max-md:pt-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.08)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Members
          </span>

          <div className="text-[28px] font-extrabold text-text-primary leading-tight mt-3 max-md:text-[22px]">
            Customers
            {total > 0 && (
              <span className="ml-2.5 text-[16px] font-semibold text-text-faint align-middle">{total.toLocaleString()}</span>
            )}
          </div>
          <div className="text-[13px] text-text-muted mt-1.5 leading-relaxed">
            {pid ? `Manage and track ${currentProject.name} loyalty members` : 'Browse all customers across your projects'}
          </div>

          {/* Search + Segment filter chips */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <div className="relative w-[280px] max-md:w-full shrink-0">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={handleSearch}
                className="w-full bg-bg-surface/60 border border-border-default text-text-primary py-2 pl-10 pr-4 rounded-lg text-sm font-sans outline-none transition-all duration-200 placeholder:text-text-faint focus:border-[#0ea5e9]/50 focus:bg-bg-surface focus:shadow-[0_0_0_3px_rgba(14,165,233,0.06)]"
              />
            </div>
            {pid && (
              <div className="flex items-center gap-1.5">
                {SEGMENT_OPTIONS.map((opt) => {
                  const isActive = segment === opt.value;
                  const count = opt.value === 'all' ? null : segmentCounts?.[opt.value] ?? null;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSegmentChange(opt.value)}
                      className={`px-3 py-2 text-[12px] font-medium rounded-lg transition-all duration-200 border cursor-pointer font-sans whitespace-nowrap ${
                        isActive
                          ? 'bg-text-primary text-bg-page border-text-primary shadow-sm'
                          : 'bg-bg-surface-raised text-text-faint border-border-default hover:text-text-secondary hover:border-border-focus/50'
                      }`}
                    >
                      {opt.label}
                      {count !== null && (
                        <span className={`ml-1.5 text-[11px] ${isActive ? 'opacity-70' : 'opacity-50'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Table card */}
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-border-default">
          <div className="text-[13px] font-bold text-text-primary tracking-wide">{tableTitle}</div>
          <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
        <div className="-mx-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Customer</th>
                {!pid && (
                  <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Project</th>
                )}
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none cursor-pointer transition-colors duration-150 hover:text-text-secondary" onClick={() => handleSort('points_balance')}>
                  Balance <SortIcon active={sortKey === 'points_balance'} dir={sortDir} />
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none cursor-pointer transition-colors duration-150 hover:text-text-secondary" onClick={() => handleSort('points_earned_total')}>
                  Earned <SortIcon active={sortKey === 'points_earned_total'} dir={sortDir} />
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none cursor-pointer transition-colors duration-150 hover:text-text-secondary" onClick={() => handleSort('order_count')}>
                  Orders <SortIcon active={sortKey === 'order_count'} dir={sortDir} />
                </th>
                <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={colSpan} className="text-center px-4 py-8 text-text-muted">Loading...</td></tr>
              )}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={colSpan} className="text-center px-4 py-8 text-text-muted">No customers found.</td></tr>
              )}
              {!loading && customers.map((c: any) => (
                <tr key={c.id} className="cursor-pointer transition-colors duration-150 hover:[&_td]:bg-bg-surface-hover/30" onClick={() => navigate(`/customer/${c.id}`)}>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent to-[#ff6a3d] text-white flex items-center justify-center text-sm font-extrabold shrink-0">
                        {(c.name || c.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-sm font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                          {c.name || '\u2014'}
                        </div>
                        <div className="text-xs text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  {!pid && (
                    <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                      <span className="text-xs font-medium text-text-muted bg-bg-surface-raised px-2 py-0.5 rounded-md whitespace-nowrap">
                        {c.project_name || projectNameMap[c.project_id] || '\u2014'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <span className="inline-block font-extrabold text-sm text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">{c.points_balance ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <span className="font-semibold text-success">{c.points_earned_total ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle text-text-secondary">{c.order_count ?? 0}</td>
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    <span className="text-xs text-text-muted whitespace-nowrap">{timeAgo(c.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5">
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
