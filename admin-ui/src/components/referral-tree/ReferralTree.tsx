import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpandIcon, CollapseIcon } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';
import { countDescendants } from './tree-utils';
import { LEVEL_COLORS } from './level-colors';
import EmptyNetwork from './EmptyNetwork';
import RootChain from './RootChain';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

interface ReferralTreeProps {
  trees: ReferralNode[];
  levelPoints?: Record<number, number>;
}

export default function ReferralTree({ trees, levelPoints = {} }: ReferralTreeProps) {
  const navigate = useNavigate();
  const [treeGen, setTreeGen] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const maxLevels = useMemo(() => {
    const keys = Object.keys(levelPoints).map(Number);
    return keys.length > 0 ? Math.max(...keys) : 3;
  }, [levelPoints]);

  const expandAll = useCallback(() => setTreeGen((g) => Math.abs(g || 0) + 1), []);
  const collapseAll = useCallback(() => setTreeGen((g) => -(Math.abs(g || 0) + 1)), []);

  const handleNavigate = useCallback((id: number | string) => {
    navigate(`/customer/${id}`);
  }, [navigate]);

  // Sort by network size (biggest first) and filter by search
  const processed = useMemo(() => {
    let list = (trees || []).map((t) => ({
      ...t,
      _total: countDescendants(t),
    }));
    list.sort((a, b) => b._total - a._total);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(q) ||
          (t.email || '').toLowerCase().includes(q) ||
          (t.referral_code || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [trees, search]);

  const totalFiltered = processed.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  if (!trees || trees.length === 0) {
    return <EmptyNetwork />;
  }

  // Build legend items from configured levels
  const legendItems = Array.from({ length: maxLevels }, (_, i) => ({
    level: i + 1,
    label: i === 0 ? `Level 1 (Direct)` : `Level ${i + 1} (Indirect)`,
    color: LEVEL_COLORS[i % LEVEL_COLORS.length].dot,
  }));

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="relative flex-1 max-w-[280px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search chains..."
            value={search}
            onChange={handleSearch}
            className="w-full bg-bg-surface border border-border-default text-text-primary py-2 pl-[34px] pr-3 rounded-[10px] text-[13px] font-sans outline-none transition-all duration-200 focus:border-border-focus placeholder:text-text-faint"
          />
        </div>
        <div className="flex gap-1.5">
          <button type="button" className="flex items-center gap-1 bg-bg-surface border border-border-default text-text-muted text-xs font-semibold font-sans px-2.5 py-[5px] rounded-lg cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary hover:border-border-focus" onClick={expandAll}>
            <ExpandIcon size={14} />
            Expand all
          </button>
          <button type="button" className="flex items-center gap-1 bg-bg-surface border border-border-default text-text-muted text-xs font-semibold font-sans px-2.5 py-[5px] rounded-lg cursor-pointer transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-secondary hover:border-border-focus" onClick={collapseAll}>
            <CollapseIcon size={14} />
            Collapse all
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-2 text-[13px] text-text-muted mb-4">
        <span className="font-bold text-text-secondary">
          {totalFiltered} chain{totalFiltered !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </span>
        <span className="w-[3px] h-[3px] rounded-full bg-text-faint" />
        <span>sorted by network size</span>
      </div>

      {/* Chains */}
      {paginated.length === 0 ? (
        <div className="text-center text-text-muted py-8">No chains match your search.</div>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {paginated.map((tree) => (
            <RootChain
              key={tree.id}
              tree={tree}
              treeGen={treeGen}
              onNavigate={handleNavigate}
              levelPoints={levelPoints}
              maxLevels={maxLevels}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalFiltered={totalFiltered}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Legend */}
      <div className="flex gap-4 flex-wrap pt-3 border-t border-border-subtle">
        {legendItems.map((item) => (
          <div key={item.level} className="flex items-center gap-1.5 text-[11px] text-text-muted whitespace-nowrap">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            {item.label} — {levelPoints[item.level] != null ? `${levelPoints[item.level]} pts/order` : 'view only'}
          </div>
        ))}
      </div>
    </>
  );
}
