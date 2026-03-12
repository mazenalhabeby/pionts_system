import { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useFetch, timeAgo, SearchIcon } from '@pionts/shared';
import { platformApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';

export default function PlatformOrganizations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const limit = 20;

  if (!user?.isSuperAdmin) return <Navigate to="/" replace />;

  const { data, loading, error } = useFetch(
    useCallback(
      () => platformApi.getOrgs({ q: search, sort, dir, limit, offset: page * limit }),
      [search, sort, dir, page],
    ),
    [search, sort, dir, page],
  );

  const handleSort = (key: string) => {
    if (sort === key) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key);
      setDir('desc');
    }
    setPage(0);
  };

  const orgs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const columns = [
    { key: 'name', label: 'Organization', sortable: true },
    { key: 'ownerEmail', label: 'Owner' },
    { key: 'plan', label: 'Plan' },
    { key: 'projectCount', label: 'Projects' },
    { key: 'memberCount', label: 'Members' },
    { key: 'customerCount', label: 'Customers' },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <h1 className="text-[20px] font-bold text-text-primary m-0">Organizations</h1>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-surface border border-border-default w-72 max-sm:w-full">
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-faint font-sans"
          />
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-default">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint ${col.sortable ? 'cursor-pointer hover:text-text-secondary' : ''}`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    {col.label}
                    {col.sortable && sort === col.key && (
                      <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10 text-text-muted">Loading...</td></tr>
              ) : orgs.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10 text-text-muted">No organizations found</td></tr>
              ) : (
                orgs.map((org: any) => (
                  <tr
                    key={org.id}
                    className="border-b border-border-subtle hover:bg-bg-surface-hover/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/platform/orgs/${org.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{org.name}</div>
                      <div className="text-[11px] text-text-faint">{org.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{org.ownerEmail || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                        org.plan === 'pro' ? 'bg-primary/15 text-primary' : 'bg-text-faint/15 text-text-muted'
                      }`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{org.projectCount}</td>
                    <td className="px-4 py-3 text-text-secondary">{org.memberCount}</td>
                    <td className="px-4 py-3 text-text-secondary">{org.customerCount}</td>
                    <td className="px-4 py-3 text-text-faint">{timeAgo(org.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
            <span className="text-[12px] text-text-faint">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-[12px] rounded-md border border-border-default bg-transparent text-text-secondary disabled:opacity-40 cursor-pointer disabled:cursor-default font-sans hover:bg-bg-surface-hover"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-[12px] rounded-md border border-border-default bg-transparent text-text-secondary disabled:opacity-40 cursor-pointer disabled:cursor-default font-sans hover:bg-bg-surface-hover"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
