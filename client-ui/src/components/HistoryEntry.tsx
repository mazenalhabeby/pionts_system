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
    <li className="flex gap-2.5 py-2 border-b border-[#eee] text-sm items-center last:border-b-0">
      <span className={`w-[50px] font-bold shrink-0 text-right ${isPositive ? 'text-[#0a8a5a]' : 'text-[#d93025]'}`}>
        {formatPoints(points)}
      </span>
      <span className="flex-1 text-[#444]">{description}</span>
      <span className="text-[#999] text-xs whitespace-nowrap">{timeAgo(created_at)}</span>
    </li>
  );
});

export default HistoryEntry;
