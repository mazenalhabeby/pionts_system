import type { PointsLogEntry } from '@pionts/shared';
import ActivityFeed from '../../components/ActivityFeed';

interface CustomerHistoryProps {
  history: PointsLogEntry[];
}

export default function CustomerHistory({ history }: CustomerHistoryProps) {
  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-5 py-3.5 border-b border-border-default">
        <div className="text-[13px] font-bold text-text-primary tracking-wide">Points History</div>
        <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md tabular-nums">
          {history.length}
        </span>
      </div>
      <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
        <ActivityFeed activities={history} />
      </div>
    </div>
  );
}
