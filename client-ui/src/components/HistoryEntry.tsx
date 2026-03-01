import React from 'react';
import { timeAgo, formatPoints } from '@pionts/shared';

interface HistoryEntryProps {
  points: number;
  description: string;
  created_at: string;
}

const HistoryEntry = React.memo(function HistoryEntry({ points, description, created_at }: HistoryEntryProps) {
  const isPositive = points >= 0;

  return (
    <li className="pw-history-item">
      <span className={`pw-history-pts ${isPositive ? 'pw-history-pts--pos' : 'pw-history-pts--neg'}`}>
        {formatPoints(points)}
      </span>
      <span className="pw-history-desc">{description}</span>
      <span className="pw-history-time">{timeAgo(created_at)}</span>
    </li>
  );
});

export default HistoryEntry;
