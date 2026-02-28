import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ icon, iconBg, title, subtitle }: PageHeaderProps) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-2xl px-8 py-7 flex items-center gap-4.5">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[22px] font-extrabold text-text-primary leading-tight max-sm:text-lg">
          {title}
        </div>
        <div className="text-[13px] text-text-muted mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}
