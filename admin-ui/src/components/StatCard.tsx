import { memo } from 'react';
import type { IconProps } from '@pionts/shared';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ComponentType<IconProps>;
}

export default memo(function StatCard({ value, label, icon: IconComponent }: StatCardProps) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-5.5 text-center">
      {IconComponent && (
        <div className="mb-2 text-primary">
          <IconComponent size={20} />
        </div>
      )}
      <div className="text-[32px] font-extrabold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted mt-1 tracking-wide">{label}</div>
    </div>
  );
});
