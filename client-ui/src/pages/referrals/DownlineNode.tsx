import { useState, useCallback, useMemo } from 'react';
import { UsersIcon, ChevronDownIcon, countDescendants } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';

export interface DownlineNodeProps {
  node: ReferralNode;
  depth?: number;
  generation: number | null;
  levelLabels: string[];
  levelEarn: string[];
}

export default function DownlineNode({ node, depth = 0, generation, levelLabels, levelEarn }: DownlineNodeProps) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const [localExpanded, setLocalExpanded] = useState(true);
  const expanded = generation != null ? generation > 0 : localExpanded;
  const tier = Math.min(depth, 2);
  const depthClass = `nt-d${tier}`;
  const initial = (node.name || '?')[0].toUpperCase();
  const descendants = useMemo(() => countDescendants(node), [node]);

  const toggle = useCallback(() => setLocalExpanded((v) => !v), []);

  return (
    <div className={`nt-branch ${depthClass} nt-branch-anim`} style={{ animationDelay: `${depth * 60}ms` }}>
      <div className={`rounded-[14px] mb-2.5 overflow-hidden transition-all duration-200 hover:-translate-y-px nt-card-d${tier}`}>
        {/* Accent stripe */}
        <div className={`h-[3px] nt-accent-d${tier}`} />
        <div className="flex items-center gap-3 px-3.5 py-3">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-full p-[2.5px] shrink-0 bg-[#e0e0e0] transition-shadow duration-[250ms] nt-ava-wrap-d${tier}`}>
            <div className={`w-full h-full rounded-full flex items-center justify-center text-base font-extrabold text-white bg-[#bbb] nt-ava-d${tier}`}>{initial}</div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1a1a1a] whitespace-nowrap overflow-hidden text-ellipsis">{node.name || 'Unknown'}</span>
              <span className={`text-[9px] font-extrabold tracking-[0.8px] uppercase px-[7px] py-0.5 rounded-md shrink-0 text-[#999] bg-[#f0f0f0] nt-lvl-d${tier}`}>{levelLabels[tier]}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-[#bbb] tracking-[0.5px]">{node.referral_code}</span>
              {levelEarn[tier] && (
                <>
                  <span className="w-[3px] h-[3px] rounded-full bg-[#ddd] shrink-0" />
                  <span className="text-[11px] text-[#0a8a5a] font-semibold">{levelEarn[tier]}</span>
                </>
              )}
            </div>
            {/* Stats row */}
            {(hasChildren || descendants > 0) && (
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#999] font-medium [&_svg]:opacity-45 [&_svg]:shrink-0">
                  <UsersIcon size={13} />
                  {children.length} direct{descendants > children.length ? ` \u00b7 ${descendants} total` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              className={`flex items-center gap-0.5 bg-bg border border-[#e8e8e8] rounded-[10px] px-2 py-1.5 cursor-pointer text-[#aaa] text-[11px] font-bold font-sans shrink-0 transition-all duration-200 leading-none hover:bg-[#eee] hover:text-[#666] hover:border-[#ddd] [&_svg]:transition-transform [&_svg]:duration-[250ms] [&_svg]:ease-in-out ${expanded ? '[&_svg]:rotate-180' : ''}`}
              onClick={toggle}
              type="button"
            >
              <span className="min-w-3.5 text-center">{children.length}</span>
              <ChevronDownIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <div className={`nt-kids nt-kids-d${tier}${expanded ? ' nt-kids-open' : ''}`}>
          {children.map((child) => (
            <DownlineNode key={child.id} node={child} depth={depth + 1} generation={generation} levelLabels={levelLabels} levelEarn={levelEarn} />
          ))}
        </div>
      )}
    </div>
  );
}
