import { useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useFetch, timeAgo } from '@pionts/shared';
import { platformApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';

export default function PlatformDashboard() {
  const { user } = useAuth();
  if (!user?.isSuperAdmin) return <Navigate to="/" replace />;

  const { data: stats, loading, error } = useFetch(
    useCallback(() => platformApi.getStats(), []),
    [],
  );

  const { data: activity } = useFetch(
    useCallback(() => platformApi.getActivity(), []),
    [],
  );

  if (loading) return <div className="text-center p-10 text-text-muted">Loading platform stats...</div>;
  if (error) return <Alert>{error}</Alert>;
  if (!stats) return null;

  const statCards = [
    { label: 'Organizations', value: stats.totalOrgs, link: '/platform/orgs' },
    { label: 'Users', value: stats.totalUsers, link: '/platform/users' },
    { label: 'Projects', value: stats.totalProjects },
    { label: 'Customers', value: stats.totalCustomers },
    { label: 'Active Projects', value: stats.activeProjects },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-4 max-md:px-5 max-md:pt-6">
          <div className="text-[11px] text-primary uppercase tracking-[2px] font-bold">Platform Admin</div>
          <div className="text-[26px] font-extrabold text-text-primary leading-tight mt-1 max-md:text-[20px]">Pionts Overview</div>
          <div className="text-[13px] text-text-muted mt-1">Cross-tenant platform statistics</div>
        </div>

        <div className="grid grid-cols-5 border-t border-border-default max-md:grid-cols-2">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className={`px-8 py-5 max-md:px-5 max-md:py-4 ${i > 0 ? 'border-l border-border-default max-md:border-l-0' : ''} ${i >= 2 ? 'max-md:border-t max-md:border-border-default' : ''} ${i % 2 !== 0 ? 'max-md:border-l max-md:border-border-default' : ''}`}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">{s.label}</div>
              <div className="text-[22px] font-bold text-text-primary leading-none">
                {s.link ? (
                  <Link to={s.link} className="text-text-primary no-underline hover:text-primary transition-colors">
                    {s.value.toLocaleString()}
                  </Link>
                ) : (
                  s.value.toLocaleString()
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links + Activity */}
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-md:grid-cols-1">
        {/* Quick Links */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-default">
            <span className="text-[13px] font-bold text-text-primary">Quick Links</span>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <Link
              to="/platform/orgs"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-default hover:bg-bg-surface-hover/30 transition-colors no-underline"
            >
              <span className="text-[13px] font-medium text-text-primary">All Organizations</span>
              <span className="ml-auto text-[12px] text-text-faint">{stats.totalOrgs}</span>
            </Link>
            <Link
              to="/platform/users"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-default hover:bg-bg-surface-hover/30 transition-colors no-underline"
            >
              <span className="text-[13px] font-medium text-text-primary">All Users</span>
              <span className="ml-auto text-[12px] text-text-faint">{stats.totalUsers}</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border-default">
            <span className="text-[13px] font-bold text-text-primary">Recent Activity</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {(activity || []).length === 0 ? (
              <div className="text-center py-10 text-[13px] text-text-muted">No activity yet</div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {(activity || []).slice(0, 10).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      a.type === 'user_signup' ? 'bg-[#4ade80]' :
                      a.type === 'project_created' ? 'bg-[#6366f1]' : 'bg-[#f59e0b]'
                    }`} />
                    <span className="text-[13px] text-text-secondary flex-1 truncate">{a.description}</span>
                    <span className="text-[11px] text-text-faint shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
