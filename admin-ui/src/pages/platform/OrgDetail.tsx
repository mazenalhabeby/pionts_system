import { useState, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useFetch, timeAgo, ArrowLeftIcon } from '@pionts/shared';
import { platformApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/alert';

export default function PlatformOrgDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'projects' | 'members'>('projects');

  if (!user?.isSuperAdmin) return <Navigate to="/" replace />;

  const { data: org, loading, error } = useFetch(
    useCallback(() => platformApi.getOrg(Number(id)), [id]),
    [id],
  );

  if (loading) return <div className="text-center p-10 text-text-muted">Loading organization...</div>;
  if (error) return <Alert>{error}</Alert>;
  if (!org) return null;

  const owner = org.members?.find((m: any) => m.role === 'owner');

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <Link
        to="/platform/orgs"
        className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary no-underline transition-colors w-fit"
      >
        <ArrowLeftIcon size={16} />
        Back to Organizations
      </Link>

      {/* Org header */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 max-md:px-5">
          <div className="flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <div className="text-[26px] font-extrabold text-text-primary leading-tight">{org.name}</div>
              <div className="text-[13px] text-text-faint mt-1">{org.slug}</div>
              <div className="flex items-center gap-4 mt-3 text-[13px]">
                {owner && (
                  <span className="text-text-muted">
                    Owner: <span className="text-text-primary font-medium">{owner.name || owner.email}</span>
                  </span>
                )}
                <span className="text-text-faint">Created {timeAgo(org.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold uppercase px-3 py-1 rounded-full ${
                org.subscription?.plan === 'pro' ? 'bg-primary/15 text-primary' : 'bg-text-faint/15 text-text-muted'
              }`}>
                {org.subscription?.plan || 'free'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-t border-border-default">
          {[
            { label: 'Projects', value: org.projects?.length || 0 },
            { label: 'Members', value: org.members?.length || 0 },
            { label: 'Total Customers', value: org.projects?.reduce((s: number, p: any) => s + (p.customerCount || 0), 0) || 0 },
          ].map((s, i) => (
            <div key={s.label} className={`px-8 py-4 ${i > 0 ? 'border-l border-border-default' : ''}`}>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-text-faint mb-1">{s.label}</div>
              <div className="text-[20px] font-bold text-text-primary">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
        <div className="flex items-center border-b border-border-default px-5">
          {(['projects', 'members'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative px-4 py-3.5 text-[13px] font-medium transition-colors bg-transparent border-none cursor-pointer font-sans capitalize ${
                tab === t ? 'text-text-primary' : 'text-text-faint hover:text-text-secondary'
              }`}
            >
              {t}
              {tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === 'projects' && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Domain</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Platform</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Customers</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Created</th>
                </tr>
              </thead>
              <tbody>
                {(org.projects || []).length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-text-muted">No projects</td></tr>
                ) : (
                  (org.projects || []).map((p: any) => (
                    <tr key={p.id} className="border-b border-border-subtle">
                      <td className="px-4 py-3 font-medium text-text-primary">{p.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.domain || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary capitalize">{p.platform}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                          p.status === 'active' ? 'bg-[#4ade80]/15 text-[#4ade80]' :
                          p.status === 'paused' ? 'bg-[#f59e0b]/15 text-[#f59e0b]' :
                          'bg-text-faint/15 text-text-muted'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.customerCount}</td>
                      <td className="px-4 py-3 text-text-faint">{timeAgo(p.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(org.members || []).length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-text-muted">No members</td></tr>
                ) : (
                  (org.members || []).map((m: any) => (
                    <tr key={m.id} className="border-b border-border-subtle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">{m.name || '—'}</span>
                          {m.isSuperAdmin && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary">Super Admin</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-text-faint/15 text-text-muted">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-faint">{timeAgo(m.joinedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
