import { useState } from 'react';
import { orgApi, getErrorMessage } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../components/ui/confirm-dialog';
import { formatDate } from '@pionts/shared';
import AddMemberForm from './AddMemberForm';

interface Member {
  id: number | string;
  name?: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_STYLES: Record<string, string> = {
  owner: 'text-accent bg-accent/10',
  member: 'text-text-muted bg-bg-surface-raised',
};

interface MemberListProps {
  members: Member[];
  onRefresh: () => void;
}

export default function MemberList({ members, onRefresh }: MemberListProps) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);

  async function handleRemove(memberId: number | string) {
    const ok = await confirm({ title: 'Remove member', message: 'This member will be removed from the organization. This cannot be undone.', confirmLabel: 'Remove', variant: 'danger', safetyText: 'REMOVE' });
    if (!ok) return;
    try {
      await orgApi.removeMember(memberId);
      onRefresh();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-5.5">
      <div className="flex justify-between items-center mb-3.5">
        <div className="text-sm font-bold text-text-primary tracking-wide">Team Members</div>
        {user?.role === 'owner' && (
          <button
            className="bg-[#ededed] text-[#0a0a0a] border-none px-5 py-2.5 rounded-lg cursor-pointer text-sm font-semibold font-sans transition-colors duration-200 hover:bg-white"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? 'Cancel' : '+ Add Member'}
          </button>
        )}
      </div>

      {showAdd && (
        <AddMemberForm
          onAdded={() => { setShowAdd(false); onRefresh(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="-mx-5.5 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Name</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Email</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Role</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none">Joined</th>
              {user?.role === 'owner' && <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wide border-b border-border-default whitespace-nowrap select-none"></th>}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={5} className="text-center px-4 py-8 text-text-muted">No members.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 border-b border-border-subtle text-sm text-text-primary align-middle">{m.name || '\u2014'}</td>
                <td className="px-4 py-3 border-b border-border-subtle text-sm text-text-secondary align-middle">{m.email}</td>
                <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${ROLE_STYLES[m.role] || ''}`}>{m.role}</span>
                </td>
                <td className="px-4 py-3 border-b border-border-subtle text-xs text-text-muted whitespace-nowrap align-middle">{formatDate(m.createdAt)}</td>
                {user?.role === 'owner' && (
                  <td className="px-4 py-3 border-b border-border-subtle text-sm align-middle">
                    {m.id !== user.id && (
                      <button
                        type="button"
                        className="bg-transparent text-error border border-error/30 px-3 py-1 rounded-md cursor-pointer text-xs font-semibold font-sans transition-all duration-150 hover:bg-error-dim hover:border-error"
                        onClick={() => handleRemove(m.id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
