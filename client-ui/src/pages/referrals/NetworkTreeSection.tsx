import { UserIcon, ExpandIcon, CollapseIcon } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';
import DownlineNode from './DownlineNode';
import EmptyNetwork from './EmptyNetwork';

interface NetworkTreeSectionProps {
  downlineTree: ReferralNode[];
  totalDescendants: number;
  directCount: number;
  referralCode: string;
  treeGen: number | null;
  levelLabels: string[];
  levelEarn: string[];
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export default function NetworkTreeSection({
  downlineTree,
  totalDescendants,
  directCount,
  referralCode,
  treeGen,
  levelLabels,
  levelEarn,
  onExpandAll,
  onCollapseAll,
}: NetworkTreeSectionProps) {
  if (downlineTree.length === 0) {
    return <EmptyNetwork />;
  }

  return (
    <>
      {/* Network toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2 max-[600px]:flex-col max-[600px]:items-start">
        <div className="flex items-center gap-2 text-[13px] text-[#888]">
          <span className="font-bold text-[#555]">{totalDescendants} member{totalDescendants !== 1 ? 's' : ''}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-[#ccc]" />
          <span>up to {levelLabels.length} levels</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="flex items-center gap-1 bg-[#f7f7f7] border border-[#e5e5e5] text-[#888] text-xs font-semibold font-sans px-2.5 py-[5px] rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#eee] hover:text-[#555] hover:border-[#ddd]"
            onClick={onExpandAll}
          >
            <ExpandIcon size={14} />
            Expand
          </button>
          <button
            type="button"
            className="flex items-center gap-1 bg-[#f7f7f7] border border-[#e5e5e5] text-[#888] text-xs font-semibold font-sans px-2.5 py-[5px] rounded-lg cursor-pointer transition-all duration-150 hover:bg-[#eee] hover:text-[#555] hover:border-[#ddd]"
            onClick={onCollapseAll}
          >
            <CollapseIcon size={14} />
            Collapse
          </button>
        </div>
      </div>

      {/* "You" root node */}
      <div className="nt-root-bg flex items-center gap-3 rounded-[14px] px-[18px] py-3.5 relative max-[600px]:px-3.5 max-[600px]:py-3">
        <div className="nt-root-ava-bg w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0">
          <UserIcon size={18} stroke="#fff" strokeWidth={2.5} />
        </div>
        <div className="flex-1 flex flex-col gap-px">
          <span className="text-[15px] font-extrabold text-white">You</span>
          <span className="text-[11px] font-mono text-white/45 tracking-[1px]">{referralCode}</span>
        </div>
        <div className="text-[11px] font-bold text-primary bg-[rgba(255,60,0,0.12)] px-2.5 py-[3px] rounded-full whitespace-nowrap">{directCount} direct</div>
      </div>

      {/* Tree */}
      <div className="nt-tree">
        {downlineTree.map((node) => (
          <DownlineNode key={node.id} node={node} depth={0} generation={treeGen} levelLabels={levelLabels} levelEarn={levelEarn} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap pt-3 border-t border-[#f0f0f0] max-[600px]:gap-2.5">
        {levelLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#999] whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full shrink-0 nt-legend-dot-d${Math.min(i, 2)}`} />
            {label} — {levelEarn[i] || 'view only'}
          </div>
        ))}
      </div>
    </>
  );
}
