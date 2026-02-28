import { cn } from '@/lib/utils';

interface EmptyStateProps {
  children: React.ReactNode;
  className?: string;
}

export function EmptyState({ children, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center p-10 text-text-muted', className)}>
      {children}
    </div>
  );
}

export function NoProject() {
  return <EmptyState>Select a project first.</EmptyState>;
}
