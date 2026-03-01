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
      <div className={`nt-card-d${tier}`} style={{ borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'all 0.2s ease' }}>
        {/* Accent stripe */}
        <div className={`nt-accent-d${tier}`} style={{ height: 3 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          {/* Avatar */}
          <div className={`nt-ava-wrap-d${tier}`} style={{ width: 44, height: 44, borderRadius: '50%', padding: 2.5, flexShrink: 0 }}>
            <div className={`nt-ava-d${tier}`} style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>{initial}</div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name || 'Unknown'}</span>
              <span className={`nt-lvl-d${tier}`} style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>{levelLabels[tier]}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontFamily: "'SF Mono', Monaco, monospace", color: '#bbb', letterSpacing: 0.5 }}>{node.referral_code}</span>
              {levelEarn[tier] && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#ddd', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{levelEarn[tier]}</span>
                </>
              )}
            </div>
            {/* Stats row */}
            {(hasChildren || descendants > 0) && (
              <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                <UsersIcon size={13} />
                {children.length} direct{descendants > children.length ? ` \u00b7 ${descendants} total` : ''}
              </div>
            )}
          </div>

          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              className="pw-btn pw-btn--secondary pw-btn--sm"
              onClick={toggle}
              type="button"
              style={{ padding: '6px 8px', gap: 2 }}
            >
              <span style={{ minWidth: 14, textAlign: 'center' }}>{children.length}</span>
              <ChevronDownIcon size={14} style={{ transition: 'transform 0.25s ease', transform: expanded ? 'rotate(180deg)' : 'none' }} />
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
