import { Pagination as SharedPagination } from '../ui/pagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalFiltered: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, totalFiltered, pageSize, onPageChange }: PaginationProps) {
  return (
    <SharedPagination
      page={page}
      totalPages={totalPages}
      total={totalFiltered}
      pageSize={pageSize}
      onPageChange={onPageChange}
    />
  );
}
