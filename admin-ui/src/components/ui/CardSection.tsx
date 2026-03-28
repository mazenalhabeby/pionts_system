import type { ReactNode } from 'react';

interface CardSectionProps {
  title: string;
  action?: ReactNode;
  badge?: string | number;
  children: ReactNode;
  className?: string;
}

export default function CardSection({ title, action, badge, children, className = '' }: CardSectionProps) {
  return (
    <div className={`bg-bg-card border border-border-default rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
        <div className="text-[14px] font-semibold text-text-primary">{title}</div>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-[11px] font-medium text-text-faint bg-bg-surface px-2 py-0.5 rounded-md">
              {badge}
            </span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}
