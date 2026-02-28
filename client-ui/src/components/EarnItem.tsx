import React from 'react';

interface EarnItemProps {
  done: boolean;
  label: string;
  points: number;
  action?: React.ReactNode;
  tag?: string;
}

const EarnItem = React.memo(function EarnItem({ done, label, points, action, tag }: EarnItemProps) {
  return (
    <li className={`flex items-center gap-2.5 py-2.5 border-b border-[#eee] text-sm last:border-b-0 ${done ? 'opacity-50' : ''}`}>
      <span className="w-6 shrink-0 text-center text-base">{done ? '\u2705' : '\u2610'}</span>
      <span className="flex-1">
        {label}
        {tag && <span className="text-[11px] text-[#999] bg-bg px-[7px] py-0.5 rounded-lg ml-1.5 font-medium">{tag}</span>}
      </span>
      <span className="text-[#0a8a5a] font-semibold whitespace-nowrap">+{points} pts</span>
      {done ? (
        <span className="text-[#999] text-xs ml-1 whitespace-nowrap">(done)</span>
      ) : action ? (
        action
      ) : null}
    </li>
  );
});

export default EarnItem;
