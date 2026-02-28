import { memo, useState, useMemo } from 'react';
import type { ReferralNode } from '@pionts/shared';
import { countDescendants, countByLevel } from './tree-utils';
import LevelBreakdown from './LevelBreakdown';
import DownlineNode from './DownlineNode';

interface RootChainProps {
  tree: ReferralNode & { _total?: number };
  treeGen: number | null;
  onNavigate: (id: number | string) => void;
  levelPoints?: Record<number, number>;
  maxLevels?: number;
}

export default memo(function RootChain({ tree, treeGen, onNavigate, levelPoints = {}, maxLevels = 3 }: RootChainProps) {
  const [open, setOpen] = useState(false);
  const initial = (tree.name || tree.email || '?')[0].toUpperCase();
  const directCount = (tree.children || []).length;
  const total = useMemo(() => countDescendants(tree), [tree]);
  const levels = useMemo(() => countByLevel(tree, maxLevels), [tree, maxLevels]);

  const indirectCount = useMemo(() => {
    return levels.slice(1).reduce((sum, n) => sum + n, 0);
  }, [levels]);

  return (
    <div className="border border-border-default rounded-2xl overflow-hidden bg-bg-surface transition-all duration-200 hover:border-text-faint">
      {/* Root row */}
      <div className="flex items-center gap-3 bg-linear-to-br from-[#111] to-[#1a1a1a] rounded-none mb-0 relative cursor-pointer transition-transform duration-150 px-[18px] py-3.5 hover:-translate-y-px" onClick={() => setOpen((v) => !v)}>
        <div className="w-[38px] h-[38px] rounded-full bg-linear-to-br from-accent to-[#ff6a3d] flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,60,0,0.35)] text-base font-extrabold text-white">{initial}</div>
        <div className="flex-1 flex flex-col gap-px">
          <span className="text-[15px] font-extrabold text-white">{tree.name || tree.email}</span>
          <span className="text-[11px] font-mono text-white/45 tracking-wider">{tree.referral_code} {'\u00B7'} {directCount} direct{indirectCount > 0 ? `, ${indirectCount} indirect` : ''}</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <LevelBreakdown levels={levels} />
          <span className="text-[11px] font-bold text-accent bg-accent/12 px-2.5 py-[3px] rounded-full whitespace-nowrap">{total} total</span>
        </div>
        <button
          className={`rounded-full px-[18px] py-1.5 text-xs font-bold font-sans cursor-pointer whitespace-nowrap shrink-0 transition-all duration-150 tracking-wide border-none ${
            open
              ? 'bg-white/15 text-white shadow-none hover:bg-white/25'
              : 'bg-accent text-white shadow-[0_2px_8px_rgba(255,60,0,0.3)] hover:bg-accent-hover hover:shadow-[0_3px_12px_rgba(255,60,0,0.4)]'
          }`}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          type="button"
        >
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Expandable tree */}
      <div className={`rt-tree-wrap bg-bg-surface ${open ? 'rt-tree-open' : ''}`}>
        {open && directCount > 0 && (
          <>
            <div className="nt-tree pt-3 pb-1 pl-7 border-l-2 border-border-default ml-[37px] mb-0 mt-4 mx-4 ml-[53px]">
              {tree.children!.map((node) => (
                <DownlineNode key={node.id} node={node} depth={0} generation={treeGen} onNavigate={onNavigate} levelPoints={levelPoints} maxLevels={maxLevels} />
              ))}
            </div>
            <div className="px-4 pb-3.5 pt-2.5 text-center">
              <button
                className="bg-transparent border border-border-default text-text-muted text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer font-sans transition-all duration-150 hover:bg-bg-surface-hover hover:text-accent hover:border-accent/40"
                onClick={() => onNavigate(tree.id)}
                type="button"
              >
                View {tree.name || tree.email}'s profile
              </button>
            </div>
          </>
        )}
        {open && directCount === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-text-muted">No referrals in this chain yet.</div>
        )}
      </div>
    </div>
  );
});
