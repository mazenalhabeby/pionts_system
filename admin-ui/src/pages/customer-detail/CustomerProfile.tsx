import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, timeAgo } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { getErrorMessage } from '../../api';

interface CustomerProfileProps {
  customer: {
    email?: string;
    name?: string;
    referral_code?: string;
    referred_by?: string;
    birthday?: string;
    created_at?: string;
    last_activity?: string;
    shopify_customer_id?: string;
  };
  referredByCustomer?: {
    id: number | string;
    name?: string;
    email?: string;
  } | null;
  canEdit?: boolean;
  onSave?: (data: { email?: string; name?: string; birthday?: string; referred_by?: string | null }) => Promise<void>;
}

interface InfoCellProps {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}

function InfoCell({ label, children, mono }: InfoCellProps) {
  return (
    <div className="flex-1 text-center px-4 py-4 max-md:flex-[0_0_33.33%] max-md:px-2 max-md:py-3 max-sm:flex-[0_0_50%]">
      <div className="text-[10px] text-text-faint uppercase tracking-[0.1em] font-semibold mb-1.5">{label}</div>
      <div className={`text-[13px] font-semibold text-text-primary ${mono ? 'font-mono tracking-wide' : ''}`}>{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="w-px self-stretch my-3 bg-border-default/60 shrink-0 max-md:hidden" />;
}

export default function CustomerProfile({ customer, referredByCustomer, canEdit, onSave }: CustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editReferredBy, setEditReferredBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function startEditing() {
    setEditEmail(customer.email || '');
    setEditName(customer.name || '');
    setEditBirthday(customer.birthday || '');
    setEditReferredBy(customer.referred_by || '');
    setEditError(null);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    setEditError(null);
    try {
      await onSave({
        email: editEmail.trim(),
        name: editName.trim(),
        birthday: editBirthday || undefined,
        referred_by: editReferredBy.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'bg-bg-inset border border-border-default text-text-primary py-1.5 px-2.5 rounded-lg text-[13px] font-sans outline-none transition-all duration-200 placeholder:text-text-faint focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(255,60,0,0.06)] w-full';

  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden transition-colors duration-200">
      <div className="flex items-center max-md:flex-wrap">
        <InfoCell label="Referral Code" mono>{customer.referral_code || '--'}</InfoCell>
        <Divider />
        <InfoCell label="Referred By">
          {referredByCustomer ? (
            <Link to={`/customer/${referredByCustomer.id}`} className="text-primary no-underline hover:underline transition-colors">
              {referredByCustomer.name || referredByCustomer.email}
            </Link>
          ) : (
            <span className="text-text-faint">{customer.referred_by || '--'}</span>
          )}
        </InfoCell>
        <Divider />
        <InfoCell label="Joined">{formatDate(customer.created_at)}</InfoCell>
        <Divider />
        <InfoCell label="Last Active">{customer.last_activity ? timeAgo(customer.last_activity) : '--'}</InfoCell>
        {customer.shopify_customer_id && (
          <>
            <Divider />
            <InfoCell label="Shopify ID" mono>{customer.shopify_customer_id}</InfoCell>
          </>
        )}
        {canEdit && onSave && !isEditing && (
          <div className="px-4 py-4 shrink-0">
            <button
              type="button"
              onClick={startEditing}
              className="px-3.5 py-2 rounded-lg bg-transparent text-text-faint text-[11px] font-semibold border border-border-default cursor-pointer font-sans transition-all duration-200 hover:text-text-secondary hover:border-border-focus"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="border-t border-border-default px-5 py-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-[10px] text-text-faint uppercase tracking-[0.1em] font-semibold">Email</label>
              <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-[10px] text-text-faint uppercase tracking-[0.1em] font-semibold">Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-[10px] text-text-faint uppercase tracking-[0.1em] font-semibold">Referred By</label>
              <input type="text" value={editReferredBy} onChange={(e) => setEditReferredBy(e.target.value)} placeholder="Referral code" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] text-text-faint uppercase tracking-[0.1em] font-semibold">Birthday</label>
              <input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !editEmail.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white text-[12px] font-bold border-none cursor-pointer font-sans transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditError(null); }}
                className="px-4 py-2 rounded-lg bg-transparent text-text-faint text-[12px] font-semibold border border-border-default cursor-pointer font-sans transition-all duration-200 hover:text-text-secondary hover:border-border-focus"
              >
                Cancel
              </button>
            </div>
          </div>
          {editError && <Alert className="mt-3">{editError}</Alert>}
        </form>
      )}
    </div>
  );
}
