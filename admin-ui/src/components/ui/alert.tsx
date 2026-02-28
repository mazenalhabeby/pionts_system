import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'success' | 'warning';

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: 'bg-error-dim border-error text-error',
  success: 'bg-success-dim border-success text-success',
  warning: 'bg-warning-dim border-warning text-warning',
};

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'error', children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg text-sm border',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
