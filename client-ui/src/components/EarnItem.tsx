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
    <li className={`pw-earn-item ${done ? 'pw-earn-item--done' : ''}`}>
      <span className={`pw-earn-item__check ${done ? 'pw-earn-item__check--done' : 'pw-earn-item__check--pending'}`}>
        {done && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        )}
      </span>
      <span className="pw-earn-item__label">
        {label}
        {tag && <span className="pw-earn-item__tag">{tag}</span>}
      </span>
      <span className={`pw-earn-item__pts ${done ? 'pw-earn-item__pts--done' : 'pw-earn-item__pts--active'}`}>+{points}</span>
      {!done && action}
    </li>
  );
});

export default EarnItem;
