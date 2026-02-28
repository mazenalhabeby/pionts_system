import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { UsersIcon } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';
import { countDescendants, countByLevel } from './tree-utils';
import { LEVEL_COLORS } from './level-colors';

interface DownlineNodeProps {
  node: ReferralNode;
  depth?: number;
  generation: number | null;
  onNavigate: (id: number | string) => void;
  levelPoints?: Record<number, number>;
  maxLevels?: number;
}

export default memo(function DownlineNode({ node, depth = 0, generation, onNavigate, levelPoints = {}, maxLevels = 3 }: DownlineNodeProps) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const [localExpanded, setLocalExpanded] = useState(true);

  useEffect(() => {
    if (generation != null) {
      setLocalExpanded(generation > 0);
    }
  }, [generation]);

  const expanded = localExpanded;
  const level = depth + 1;
  const rewarded = levelPoints[level] != null;
  const tier = depth % LEVEL_COLORS.length;
  const styles = LEVEL_COLORS[tier];
  const initial = (node.name || node.email || '?')[0].toUpperCase();
  const descendants = useMemo(() => countDescendants(node), [node]);
  const levels = useMemo(() => countByLevel(node, maxLevels), [node, maxLevels]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalExpanded((v) => !v);
  }, []);

  const handleCardClick = useCallback(() => {
    if (hasChildren) {
      setLocalExpanded((v) => !v);
    } else {
      onNavigate(node.id);
    }
  }, [hasChildren, onNavigate, node.id]);

  // Build descendant summary (e.g. "5 direct · 3 sub · 1 L3 · 9 total")
  const descendantSummary = useMemo(() => {
    if (descendants === 0) return null;
    const parts: string[] = [];
    for (let i = 0; i < levels.length; i++) {
      if (levels[i] > 0) {
        if (i === 0) parts.push(`${levels[i]} direct`);
        else parts.push(`${levels[i]} L${i + 1 + depth}`);
      }
    }
    parts.push(`${descendants} total`);
    return parts;
  }, [descendants, levels, depth]);

  return (
    <div className={`nt-branch nt-d${tier} nt-branch-anim relative`} style={{ animationDelay: `${depth * 60}ms` }}>
      <div
        className={`group rounded-[14px] mb-2.5 overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-px ${
          rewarded
            ? `${styles.card} ${styles.cardHover}`
            : 'bg-bg-surface-raised/50 border border-border-subtle opacity-60'
        }`}
        onClick={handleCardClick}
      >
        <div className={`h-[3px] ${rewarded ? styles.accent : 'bg-border-subtle'}`} />
        <div className="flex items-center gap-3 px-3.5 py-3">
          <div
            className={`w-11 h-11 rounded-full p-[2.5px] shrink-0 transition-shadow duration-250 ${
              rewarded ? `${styles.avaWrap} ${styles.avaHover}` : 'bg-bg-surface-raised'
            }`}
            onClick={(e) => { e.stopPropagation(); onNavigate(node.id); }}
          >
            <div className={`w-full h-full rounded-full flex items-center justify-center text-base font-extrabold text-white ${
              rewarded ? styles.ava : 'bg-text-faint/30 !text-text-faint'
            }`}>{initial}</div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:underline hover:text-accent" onClick={(e) => { e.stopPropagation(); onNavigate(node.id); }}>{node.name || node.email || 'Unknown'}</span>
              <span className={`text-[9px] font-extrabold tracking-wide uppercase px-[7px] py-0.5 rounded-md shrink-0 ${
                rewarded ? styles.lvl : 'text-text-faint bg-bg-surface-raised'
              }`}>Level {level}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-text-faint tracking-wide">{node.referral_code}</span>
              {rewarded ? (
                <>
                  <span className="w-[3px] h-[3px] rounded-full bg-text-faint shrink-0" />
                  <span className="text-[11px] text-success font-semibold">{levelPoints[level]} pts/order</span>
                </>
              ) : (
                <>
                  <span className="w-[3px] h-[3px] rounded-full bg-text-faint shrink-0" />
                  <span className="text-[11px] text-text-faint italic">No reward</span>
                </>
              )}
            </div>
            {descendantSummary && (
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-text-muted font-medium [&_svg]:opacity-45 [&_svg]:shrink-0">
                  <UsersIcon size={13} />
                  {descendantSummary.map((part, i) => (
                    <span key={i}>
                      {i > 0 && <> {'\u00B7'} </>}
                      {part}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {hasChildren && (
            <button
              className={`rounded-full px-4 py-1.5 text-xs font-bold font-sans cursor-pointer whitespace-nowrap shrink-0 transition-all duration-150 tracking-wide border-none ${
                expanded
                  ? 'bg-[#ededed] text-[#0a0a0a] hover:bg-white'
                  : 'bg-accent text-white shadow-[0_2px_6px_rgba(255,60,0,0.25)] hover:bg-accent-hover hover:shadow-[0_3px_10px_rgba(255,60,0,0.35)]'
              }`}
              onClick={toggle}
              type="button"
            >
              {expanded ? 'Collapse' : `Expand (${children.length})`}
            </button>
          )}
        </div>
      </div>

      {hasChildren && (
        <div className={`nt-kids ml-4 pl-6 border-l-2 border-border-default ${rewarded ? styles.kidsColor : 'border-l-border-subtle'} ${expanded ? 'nt-kids-open' : ''}`}>
          {children.map((child) => (
            <DownlineNode key={child.id} node={child} depth={depth + 1} generation={generation} onNavigate={onNavigate} levelPoints={levelPoints} maxLevels={maxLevels} />
          ))}
        </div>
      )}
    </div>
  );
});
