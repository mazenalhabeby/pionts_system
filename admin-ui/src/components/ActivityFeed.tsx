import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatPoints, timeAgo } from '@pionts/shared';
import type { PointsLogEntry } from '@pionts/shared';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  signup: { label: 'Signup', color: 'text-primary bg-primary/10' },
  purchase: { label: 'Purchase', color: 'text-success bg-success-dim' },
  first_order: { label: '1st Order', color: 'text-success bg-success-dim' },
  referral_l1: { label: 'Referral L1', color: 'text-accent bg-accent/10' },
  referral_l2: { label: 'Referral L2', color: 'text-[#0ea5e9] bg-[#0ea5e9]/10' },
  referral_l3: { label: 'Referral L3', color: 'text-[#6366f1] bg-[#6366f1]/10' },
  redeem: { label: 'Redeemed', color: 'text-error bg-error-dim' },
  clawback: { label: 'Clawback', color: 'text-error bg-error-dim' },
  manual_award: { label: 'Manual', color: 'text-warning bg-warning-dim' },
  manual_deduct: { label: 'Manual', color: 'text-warning bg-warning-dim' },
  review_photo: { label: 'Review', color: 'text-primary bg-primary/10' },
  review_text: { label: 'Review', color: 'text-primary bg-primary/10' },
  follow_tiktok: { label: 'Social', color: 'text-primary bg-primary/10' },
  follow_instagram: { label: 'Social', color: 'text-primary bg-primary/10' },
  share_product: { label: 'Share', color: 'text-primary bg-primary/10' },
  birthday: { label: 'Birthday', color: 'text-warning bg-warning-dim' },
};

interface ActivityFeedProps {
  activities: PointsLogEntry[];
}

export default memo(function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return <div className="text-center py-10 text-[13px] text-text-muted">No recent activity.</div>;
  }

  return (
    <div className="divide-y divide-border-subtle">
      {activities.map((item, idx) => {
        const pts = Number(item.points);
        const isPositive = pts > 0;
        const meta = TYPE_LABELS[item.type] || { label: item.type, color: 'text-text-muted bg-bg-surface-raised' };

        return (
          <div key={item.id || idx} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-surface-hover/30 transition-colors">
            <span className={`w-[48px] text-right text-[13px] font-bold shrink-0 ${isPositive ? 'text-success' : 'text-error'}`}>
              {formatPoints(pts)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
              {meta.label}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-text-secondary truncate">{item.description}</div>
              {item.name && item.customer_id && (
                <Link to={`/customer/${item.customer_id}`} className="text-[12px] text-primary no-underline hover:underline">{item.name}</Link>
              )}
            </div>
            <span className="text-[11px] text-text-faint whitespace-nowrap shrink-0">{timeAgo(item.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
});
