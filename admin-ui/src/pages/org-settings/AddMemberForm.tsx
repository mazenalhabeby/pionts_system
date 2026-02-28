import { useState, useCallback } from 'react';
import { invitationsApi, getErrorMessage } from '../../api';
import { useFetch, formatDate } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { useConfirm } from '../../components/ui/confirm-dialog';

interface AddMemberFormProps {
  onAdded: () => void;
  onCancel: () => void;
}

export default function AddMemberForm({ onAdded, onCancel }: AddMemberFormProps) {
  const confirm = useConfirm();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ email: string; isExistingUser: boolean } | null>(null);

  const { data: pending, refresh: refreshPending } = useFetch(
    useCallback(() => invitationsApi.list(), []),
  );

  // Filter to org-level invitations only (no projectId)
  const orgPending = (pending || []).filter((inv: any) => !inv.projectId);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setSending(true);
    try {
      const result = await invitationsApi.create({ email, role });
      setSuccess({ email, isExistingUser: result.isExistingUser });
      setEmail('');
      setRole('member');
      refreshPending();
      onAdded();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleResend(id: number) {
    try {
      await invitationsApi.resend(id);
      refreshPending();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  async function handleRevoke(id: number, invEmail: string) {
    const ok = await confirm({
      title: 'Revoke invitation',
      message: `Revoke the invitation for ${invEmail}? They will no longer be able to join.`,
      confirmLabel: 'Revoke',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await invitationsApi.revoke(id);
      refreshPending();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 0 ? 'Expiring soon' : `${days}d left`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Send invitation form */}
      <div className="bg-bg-surface-raised border border-border-default rounded-[10px] p-4">
        {error && <Alert className="mb-3">{error}</Alert>}
        {success && (
          <Alert variant="success" className="mb-3">
            Invitation sent to <strong>{success.email}</strong>
            <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${success.isExistingUser ? 'bg-accent/10 text-accent' : 'bg-[#6366f1]/10 text-[#818cf8]'}`}>
              {success.isExistingUser ? 'Registered' : 'New User'}
            </span>
          </Alert>
        )}
        <form onSubmit={handleSend}>
          <div className="flex gap-2 items-center flex-wrap max-md:flex-col max-md:items-stretch">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-bg-surface border border-border-default text-text-primary px-3 py-2 rounded-md text-[13px] font-sans outline-none flex-1 min-w-[180px] focus:border-border-focus placeholder:text-text-faint"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-bg-surface border border-border-default text-text-primary px-3 py-2 rounded-md text-[13px] font-sans outline-none flex-[0_0_auto] min-w-[100px] cursor-pointer focus:border-border-focus"
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="submit"
              className="bg-[#ededed] text-[#0a0a0a] border-none px-4 py-2 rounded-md cursor-pointer text-sm font-semibold font-sans transition-colors duration-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>

      {/* Pending invitations */}
      {orgPending.length > 0 && (
        <div className="bg-bg-surface-raised border border-border-default rounded-[10px] p-4">
          <div className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-3">
            Pending Invitations ({orgPending.length})
          </div>
          <div className="flex flex-col gap-2">
            {orgPending.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 bg-bg-surface border border-border-default rounded-lg px-4 py-3 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary truncate">{inv.email}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    <span className="capitalize">{inv.role}</span>
                    <span className="mx-1.5">·</span>
                    Sent {formatDate(inv.createdAt)}
                    <span className="mx-1.5">·</span>
                    <span className={inv.expiresAt && new Date(inv.expiresAt).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000 ? 'text-warning' : ''}>
                      {daysUntil(inv.expiresAt)}
                    </span>
                    {inv.isExistingUser && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span className="text-accent font-semibold">Registered</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="bg-transparent text-text-muted border border-border-default px-3 py-1 rounded-md cursor-pointer text-xs font-semibold font-sans transition-all duration-150 hover:bg-bg-surface-hover hover:text-text-primary hover:border-border-focus"
                    onClick={() => handleResend(inv.id)}
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    className="bg-transparent text-error border border-error/30 px-3 py-1 rounded-md cursor-pointer text-xs font-semibold font-sans transition-all duration-150 hover:bg-error-dim hover:border-error"
                    onClick={() => handleRevoke(inv.id, inv.email)}
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
