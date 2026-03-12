import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useFetch, timeAgo, SearchIcon } from '@pionts/shared';
import { platformApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';

export default function PlatformUsers() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  if (!user?.isSuperAdmin) return <Navigate to="/" replace />;

  const { data, loading, error } = useFetch(
    useCallback(
      () => platformApi.getUsers({ q: search, limit, offset: page * limit }),
      [search, page],
    ),
    [search, page],
  );

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <h1 className="text-[20px] font-bold text-text-primary m-0">Users</h1>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-surface border border-border-default w-72 max-sm:w-full">
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder="Search users..."
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
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Email</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Organizations</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-text-muted">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-text-muted">No users found</td></tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border-subtle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{u.name || '—'}</span>
                        {u.isSuperAdmin && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary">Super Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.orgs || []).map((o: any) => (
                          <span key={o.id} className="text-[11px] px-2 py-0.5 rounded bg-bg-surface text-text-muted">
                            {o.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(u.orgs || []).map((o: any) => (
                        <span key={o.id} className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-text-faint/15 text-text-muted mr-1">
                          {o.role}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-text-faint">{timeAgo(u.createdAt)}</td>
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
