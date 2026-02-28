import { useState, useCallback } from 'react';
import { projectApi, invitationsApi, getErrorMessage } from '../../api';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useFetch, formatDate } from '@pionts/shared';
import type { ProjectMember, ProjectRole } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { useConfirm } from '../../components/ui/confirm-dialog';

const ROLE_OPTIONS: ProjectRole[] = ['admin', 'editor', 'viewer'];

const ROLE_META: Record<string, { color: string; bg: string; gradient: string; desc: string; selectedBorder: string; selectedBg: string; hoverBorder: string }> = {
  owner: { color: 'text-[#d97706]', bg: 'bg-[#f59e0b]/10', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', desc: 'Full control — can transfer ownership and manage everything', selectedBorder: '#f59e0b', selectedBg: 'rgba(245,158,11,0.08)', hoverBorder: 'rgba(245,158,11,0.4)' },
  admin: { color: 'text-accent', bg: 'bg-accent/10', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', desc: 'Full access — can manage settings, members, and all data', selectedBorder: '#f97316', selectedBg: 'rgba(249,115,22,0.08)', hoverBorder: 'rgba(249,115,22,0.4)' },
  editor: { color: 'text-[#818cf8]', bg: 'bg-[#6366f1]/10', gradient: 'linear-gradient(135deg, #818cf8, #6366f1)', desc: 'Can edit customers, points, and settings — no member management', selectedBorder: '#818cf8', selectedBg: 'rgba(129,140,248,0.08)', hoverBorder: 'rgba(129,140,248,0.4)' },
  viewer: { color: 'text-text-muted', bg: 'bg-bg-surface-raised', gradient: 'linear-gradient(135deg, #9ca3af, #6b7280)', desc: 'Read-only access to all project data', selectedBorder: '#9ca3af', selectedBg: 'rgba(156,163,175,0.08)', hoverBorder: 'rgba(156,163,175,0.4)' },
};

export default function ProjectTeam() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const { currentProject, canAdmin, isProjectOwner } = useProject();
  const pid = currentProject?.id;

  const { data: members, loading, error, refresh } = useFetch(
    useCallback(() => projectApi.getMembers(pid!), [pid]),
    [pid],
  );

  const { data: pendingInvites, refresh: refreshInvites } = useFetch(
    useCallback(() => invitationsApi.list(), []),
  );

  const [actionError, setActionError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Filter pending invitations for this project
  const projectPending = (pendingInvites || []).filter((inv: any) => inv.projectId === pid);

  const isOrgOwner = user?.role === 'owner';
  const canTransfer = isProjectOwner || isOrgOwner;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !pid) return;
    setActionError('');
    setInviteSuccess('');
    setInviting(true);
    try {
      await invitationsApi.create({ email: inviteEmail, role: inviteRole, projectId: pid });
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('editor');
      refreshInvites();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeInvite(id: number, invEmail: string) {
    const ok = await confirm({
      title: 'Revoke invitation',
      message: `Revoke the invitation for ${invEmail}?`,
      confirmLabel: 'Revoke',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await invitationsApi.revoke(id);
      refreshInvites();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  async function handleResendInvite(id: number) {
    try {
      await invitationsApi.resend(id);
      refreshInvites();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  async function handleTransferOwnership(targetUserId: number, targetName: string) {
    const ok = await confirm({
      title: 'Transfer ownership',
      message: `Transfer project ownership to "${targetName}"? You will be demoted to admin.`,
      confirmLabel: 'Transfer',
      variant: 'danger',
      safetyText: 'TRANSFER',
    });
    if (!ok) return;
    setTransferring(true);
    setActionError('');
    try {
      await projectApi.transferOwnership(pid!, targetUserId);
      refresh();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setTransferring(false);
    }
  }

  if (!pid) return null;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading team...</div>;
  if (error) return <Alert>{error}</Alert>;

  const memberList: ProjectMember[] = members || [];

  async function handleRoleChange(userId: number, role: string) {
    try {
      await projectApi.updateMemberRole(pid!, userId, role);
      refresh();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  async function handleRemove(userId: number, name: string) {
    const ok = await confirm({ title: 'Remove member', message: `Remove "${name}" from this project? They will lose all access.`, confirmLabel: 'Remove', variant: 'danger', safetyText: 'REMOVE' });
    if (!ok) return;
    try {
      await projectApi.removeMember(pid!, userId);
      refresh();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header Card with Invite ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold text-text-primary">Project Team</div>
            <div className="text-[12px] text-text-muted mt-0.5">
              {memberList.length} {memberList.length === 1 ? 'member' : 'members'}
            </div>
          </div>
        </div>

        {/* ── Invite Section ── */}
        {(isOrgOwner || canAdmin) && (
          <div className="px-6 pb-5">
            <div className="bg-bg-surface border border-border-default rounded-xl p-5">
              {actionError && <Alert className="mb-3">{actionError}</Alert>}
              {inviteSuccess && <Alert variant="success" className="mb-3">{inviteSuccess}</Alert>}
              <form onSubmit={handleInvite} className="flex gap-3 items-end">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-1.5">Email</div>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-bg-surface-raised border border-border-default text-text-primary px-3 py-2.5 rounded-lg text-[13px] font-sans outline-none focus:border-border-focus placeholder:text-text-faint"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="bg-text-primary text-bg-page border-none px-5 py-2.5 rounded-lg cursor-pointer text-[13px] font-semibold font-sans transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </form>

              {/* Role Cards */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {ROLE_OPTIONS.map((r) => {
                  const meta = ROLE_META[r];
                  const selected = inviteRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className="text-left p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-transparent font-sans"
                      style={{
                        borderColor: selected ? meta.selectedBorder : 'var(--color-border-default)',
                        background: selected ? meta.selectedBg : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = meta.hoverBorder; }}
                      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold uppercase shrink-0"
                          style={{ background: meta.gradient }}
                        >
                          {r[0]}
                        </div>
                        <span className="text-[13px] font-bold text-text-primary capitalize">{r}</span>
                      </div>
                      <div className="text-[11px] text-text-muted leading-relaxed">{meta.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {actionError && <Alert>{actionError}</Alert>}

      {/* ── Member Cards ── */}
      {memberList.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-2xl px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-[14px] font-semibold text-text-primary mb-1">No project members yet</div>
          <div className="text-[12px] text-text-muted">Add team members to grant project-specific roles.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {memberList.map((m) => {
            const role = ROLE_META[m.role] || ROLE_META.viewer;
            const initial = (m.user.name || m.user.email || '?')[0].toUpperCase();
            const isMemberOwner = m.role === 'owner';
            return (
              <div key={m.id} className="bg-bg-card border border-border-default rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap group/member transition-all duration-200">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white text-[15px] font-extrabold"
                  style={{ background: role.gradient }}
                >
                  {initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[14px] font-bold text-text-primary truncate">{m.user.name || m.user.email}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${role.color} ${role.bg}`}>
                      {m.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {m.user.name && (
                      <>
                        <span className="text-[12px] text-text-muted">{m.user.email}</span>
                        <span className="w-[3px] h-[3px] rounded-full bg-text-faint shrink-0" />
                      </>
                    )}
                    <span className="text-[11px] text-text-faint">Added {formatDate(m.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                {(isOrgOwner || canAdmin) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isMemberOwner ? (
                      <span className="text-[11px] text-text-faint italic">Project Owner</span>
                    ) : (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                          className="bg-bg-surface border border-border-default text-text-primary px-3 py-1.5 rounded-lg text-[12px] font-semibold font-sans outline-none cursor-pointer focus:border-border-focus"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                        {canTransfer && (
                          <button
                            type="button"
                            disabled={transferring}
                            className="text-[11px] text-text-muted border border-border-default bg-transparent px-2.5 py-1.5 rounded-lg cursor-pointer font-semibold font-sans transition-all duration-150 hover:bg-[#f59e0b]/10 hover:text-[#d97706] hover:border-[#f59e0b]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleTransferOwnership(m.userId, m.user.name || m.user.email)}
                            title="Transfer project ownership to this member"
                          >
                            Make Owner
                          </button>
                        )}
                        <button
                          type="button"
                          className="opacity-0 group-hover/member:opacity-100 transition-opacity duration-150 w-8 h-8 rounded-lg flex items-center justify-center text-text-faint hover:text-error hover:bg-error-dim cursor-pointer border-none bg-transparent shrink-0"
                          onClick={() => handleRemove(m.userId, m.user.name || m.user.email)}
                          title="Remove member"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pending Project Invitations ── */}
      {projectPending.length > 0 && (
        <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default">
            <div className="text-[13px] font-bold text-text-primary">Pending Invitations</div>
            <div className="text-[11px] text-text-muted mt-0.5">{projectPending.length} pending</div>
          </div>
          <div className="divide-y divide-border-default">
            {projectPending.map((inv: any) => (
              <div key={inv.id} className="px-6 py-3.5 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary truncate">{inv.email}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    <span className="capitalize">{inv.role}</span>
                    <span className="mx-1.5">·</span>
                    Sent {formatDate(inv.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="bg-transparent text-text-muted border border-border-default px-3 py-1 rounded-md cursor-pointer text-xs font-semibold font-sans transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary"
                    onClick={() => handleResendInvite(inv.id)}
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    className="bg-transparent text-error border border-error/30 px-3 py-1 rounded-md cursor-pointer text-xs font-semibold font-sans transition-all duration-150 hover:bg-error-dim hover:border-error"
                    onClick={() => handleRevokeInvite(inv.id, inv.email)}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
