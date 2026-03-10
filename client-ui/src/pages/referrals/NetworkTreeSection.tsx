import { UserIcon, ExpandIcon, CollapseIcon } from '@pionts/shared';
import type { ReferralNode } from '@pionts/shared';
import DownlineNode from './DownlineNode';
import EmptyNetwork from './EmptyNetwork';
import { useI18n } from '../../i18n';

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
  const { t, tPlural } = useI18n();

  if (downlineTree.length === 0) {
    return <EmptyNetwork />;
  }

  return (
    <>
      {/* Network toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#71717a' }}>
          <span style={{ fontWeight: 700, color: '#555' }}>{tPlural('network.members', totalDescendants)}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#ccc', display: 'inline-block' }} />
          <span>{t('network.up_to_levels', { count: levelLabels.length })}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="pw-btn pw-btn--secondary pw-btn--sm"
            onClick={onExpandAll}
          >
            <ExpandIcon size={14} />
            {t('network.expand')}
          </button>
          <button
            type="button"
            className="pw-btn pw-btn--secondary pw-btn--sm"
            onClick={onCollapseAll}
          >
            <CollapseIcon size={14} />
            {t('network.collapse')}
          </button>
        </div>
      </div>

      {/* "You" root node */}
      <div className="nt-root-bg" style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '14px 18px', position: 'relative' }}>
        <div className="nt-root-ava-bg" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserIcon size={18} stroke="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t('common.you')}</span>
          <span style={{ fontSize: 11, fontFamily: "'SF Mono', Monaco, monospace", color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>{referralCode}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' }}>{t('network.direct', { count: directCount })}</div>
      </div>

      {/* Tree */}
      <div className="nt-tree">
        {downlineTree.map((node) => (
          <DownlineNode key={node.id} node={node} depth={0} generation={treeGen} levelLabels={levelLabels} levelEarn={levelEarn} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f0f0f3' }}>
        {levelLabels.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#71717a', whiteSpace: 'nowrap' }}>
            <span className={`nt-legend-dot-d${Math.min(i, 2)}`} style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
            {label} — {levelEarn[i] || t('network.view_only')}
          </div>
        ))}
      </div>
    </>
  );
}
