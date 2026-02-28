interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-1 max-sm:flex-col max-sm:gap-3 max-sm:items-center">
      <div className="text-xs text-text-muted font-medium">
        Showing {from}&ndash;{to} of {total}
      </div>
      <div className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          &lsaquo;
        </PageButton>
        {buildPageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-sm text-text-faint px-1 select-none">
              &hellip;
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </PageButton>
          ),
        )}
        <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          &rsaquo;
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center min-w-[34px] h-[34px] px-2 rounded-lg border text-[13px] font-semibold font-sans cursor-pointer transition-all duration-150 ${
        active
          ? 'bg-[#ededed] border-[#ededed] text-[#0a0a0a]'
          : 'border-border-default bg-bg-surface text-text-secondary hover:bg-bg-surface-hover hover:border-text-faint hover:text-text-primary'
      } disabled:opacity-35 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function buildPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
