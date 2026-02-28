import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dashboardApi, partnersApi, getErrorMessage } from '../../api';
import { useProject } from '../../context/ProjectContext';
import { useFetch, timeAgo } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { useConfirm } from '../../components/ui/confirm-dialog';
import { NoProject } from '../../components/ui/empty-state';
import CustomerHero from './CustomerHero';
import CustomerProfile from './CustomerProfile';
import ReferralChain from './ReferralChain';
import ManualActions from './ManualActions';
import DirectReferralsTable from './DirectReferralsTable';
import CustomerHistory from './CustomerHistory';

type RefTabId = 'direct' | 'chain' | 'earnings';

interface PartnerEarning {
  id: number;
  orderId: string;
  orderTotal: string;
  commissionPct: string;
  amountEarned: string;
  rewardType: string;
  createdAt: string;
  customer: { id: number; name?: string; email?: string };
}

/* ── Partner Earnings Table ── */

function PartnerEarningsTable({ earnings }: { earnings: PartnerEarning[] }) {
  if (!earnings.length) {
    return <div className="text-center py-8 text-[13px] text-text-muted">No earnings yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border-default">
            {['Customer', 'Order', 'Order Total', 'Commission', 'Earned', 'Type', 'Date'].map((h, i) => (
              <th key={h} className={`text-[10px] font-semibold text-text-faint uppercase tracking-[0.1em] px-3 py-2.5 ${i >= 2 && i <= 4 ? 'text-right' : ''} ${i === 6 ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {earnings.map((e) => (
            <tr key={e.id} className="border-b border-border-default/30 last:border-0 hover:bg-bg-surface-hover/30 transition-colors duration-150">
              <td className="px-3 py-2.5">
                <Link to={`/customers/${e.customer.id}`} className="text-[13px] text-primary font-medium hover:underline no-underline transition-colors">
                  {e.customer.name || e.customer.email}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-[12px] text-text-secondary font-mono">#{e.orderId}</td>
              <td className="px-3 py-2.5 text-[13px] text-text-primary text-right font-medium tabular-nums">${Number(e.orderTotal).toFixed(2)}</td>
              <td className="px-3 py-2.5 text-[13px] text-text-secondary text-right tabular-nums">{Number(e.commissionPct)}%</td>
              <td className="px-3 py-2.5 text-right">
                <span className="text-[13px] font-bold text-success tabular-nums">${Number(e.amountEarned).toFixed(2)}</span>
              </td>
              <td className="px-3 py-2.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  e.rewardType === 'credit' ? 'text-[#f59e0b] bg-[#f59e0b]/10' : 'text-success bg-success-dim'
                }`}>
                  {e.rewardType === 'credit' ? 'Credit' : 'Points'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-[11px] text-text-faint text-right whitespace-nowrap">{timeAgo(e.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Referral / Earnings Tabs ── */

function ReferralTabs({ customer, referredByCustomer, grandparent, directReferrals, isPartner, projectId, customerId }: {
  customer: { name?: string; email?: string };
  referredByCustomer?: { id: number | string; name?: string; email?: string } | null;
  grandparent?: { id: number | string; name?: string; email?: string } | null;
  directReferrals: any[];
  isPartner?: boolean;
  projectId: number | string;
  customerId: number | string;
}) {
  const [active, setActive] = useState<RefTabId>('direct');
  const [earnings, setEarnings] = useState<PartnerEarning[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const hasChain = !!(referredByCustomer || grandparent);

  useEffect(() => {
    if (isPartner && active === 'earnings') {
      setEarningsLoading(true);
      partnersApi.getEarnings(projectId, customerId)
        .then((data: PartnerEarning[]) => setEarnings(data))
        .catch(() => setEarnings([]))
        .finally(() => setEarningsLoading(false));
    }
  }, [isPartner, active, projectId, customerId]);

  const tabs: { id: RefTabId; label: string; count?: number }[] = [
    { id: 'direct', label: 'Direct Referrals', count: directReferrals.length },
    ...(!isPartner ? [{ id: 'chain' as const, label: 'Referral Chain', count: hasChain ? (referredByCustomer && grandparent ? 2 : 1) : 0 }] : []),
    ...(isPartner ? [{ id: 'earnings' as const, label: 'Partner Earnings', count: earnings.length }] : []),
  ];

  const currentTab = tabs.find(t => t.id === active) ? active : 'direct';

  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-default">
        <span className="text-[13px] font-bold text-text-primary tracking-wide">Referrals</span>
      </div>
      <div className="flex items-center justify-between border-b border-border-default px-1">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`relative px-5 py-3.5 text-[13px] font-medium transition-all duration-200 bg-transparent border-none cursor-pointer font-sans ${
                currentTab === tab.id ? 'text-text-primary' : 'text-text-faint hover:text-text-secondary'
              }`}
            >
              {tab.label}
              {currentTab === tab.id && <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-primary rounded-full" />}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md mr-4 tabular-nums">
          {tabs.find(t => t.id === currentTab)?.count ?? 0}
        </span>
      </div>
      <div className="p-5 max-h-[520px] overflow-y-auto custom-scrollbar">
        {currentTab === 'direct' && <DirectReferralsTable directReferrals={directReferrals} />}
        {currentTab === 'chain' && <ReferralChain customer={customer} referredByCustomer={referredByCustomer} grandparent={grandparent} />}
        {currentTab === 'earnings' && (earningsLoading
          ? <div className="text-center py-8 text-[13px] text-text-muted">Loading earnings...</div>
          : <PartnerEarningsTable earnings={earnings} />
        )}
      </div>
    </div>
  );
}

/* ── Partner Actions Card ── */

function PartnerActions({ customer, projectId, onUpdate }: {
  customer: { id: number; is_partner?: boolean; partner_commission_pct?: number };
  projectId: number | string;
  onUpdate: () => void;
}) {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [commission, setCommission] = useState('10');
  const [editCommission, setEditCommission] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ totalEarned: number; totalOrders: number } | null>(null);

  useEffect(() => {
    if (customer.is_partner) {
      partnersApi.getEarnings(projectId, customer.id).then((data: PartnerEarning[]) => {
        const totalEarned = data.reduce((sum: number, e: PartnerEarning) => sum + Number(e.amountEarned), 0);
        setStats({ totalEarned, totalOrders: data.length });
      }).catch(() => setStats(null));
    }
  }, [customer.is_partner, customer.id, projectId]);

  const inputClass = 'w-20 text-center bg-bg-inset border border-border-default text-text-primary p-2 rounded-lg font-sans outline-none transition-all duration-200 focus:border-[#f59e0b]/50 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.08)] text-sm';
  const btnSmall = 'px-3.5 py-2 rounded-lg cursor-pointer text-[12px] font-semibold font-sans transition-all duration-200';

  if (customer.is_partner) {
    return (
      <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden flex flex-col">
        {/* Header bar matching ManualActions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-default">
          <span className="text-[13px] font-bold text-text-primary tracking-wide">Partner Status</span>
          <span className="text-[10px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }}>
            Active
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { label: 'Commission', value: `${customer.partner_commission_pct}%`, color: 'text-[#f59e0b]', glow: '0 0 16px rgba(245, 158, 11, 0.2)' },
              { label: 'Earned', value: stats ? `$${stats.totalEarned.toFixed(2)}` : '—', color: 'text-success', glow: '0 0 16px rgba(80, 227, 194, 0.2)' },
              { label: 'Orders', value: stats ? String(stats.totalOrders) : '—', color: 'text-text-primary', glow: '0 0 16px rgba(237, 237, 237, 0.12)' },
            ].map((s) => (
              <div key={s.label} className="text-center py-3 bg-bg-surface-raised/80 border border-border-default rounded-lg backdrop-blur-sm transition-all duration-200 hover:border-border-focus/20">
                <div className={`text-[17px] font-extrabold ${s.color} leading-none tabular-nums`} style={{ textShadow: s.glow }}>{s.value}</div>
                <div className="text-[9px] text-text-faint mt-1.5 uppercase tracking-[0.1em] font-semibold">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Edit commission */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-[12px] text-text-muted font-medium">Commission %</label>
            {isEditing ? (
              <>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editCommission}
                  onChange={(e) => setEditCommission(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  className={`${btnSmall} bg-text-primary text-bg-page border-none hover:bg-text-secondary disabled:opacity-50`}
                  disabled={loading || !editCommission}
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      await partnersApi.updateCommission(projectId, customer.id, parseFloat(editCommission));
                      setIsEditing(false);
                      onUpdate();
                    } catch (err) {
                      setError(getErrorMessage(err));
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className={`${btnSmall} bg-transparent text-text-faint border border-border-default hover:text-text-secondary hover:border-border-focus`}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-[15px] font-bold text-text-primary tabular-nums">{customer.partner_commission_pct}%</span>
                <button
                  type="button"
                  className={`${btnSmall} bg-transparent text-text-faint border border-border-default hover:text-text-secondary hover:border-border-focus`}
                  onClick={() => {
                    setEditCommission(String(customer.partner_commission_pct ?? 10));
                    setIsEditing(true);
                  }}
                >
                  Edit
                </button>
              </>
            )}
          </div>

          {error && <Alert className="mb-3">{error}</Alert>}

          {/* Remove button at bottom */}
          <div className="mt-auto pt-1">
            <button
              type="button"
              className="bg-transparent text-error/80 border border-error/20 px-4 py-2 rounded-lg cursor-pointer text-[12px] font-semibold font-sans transition-all duration-200 hover:bg-error-dim hover:border-error/40 hover:text-error active:scale-[0.97]"
              disabled={loading}
              onClick={async () => {
                const ok = await confirm({ title: 'Remove partner', message: 'This customer will lose partner status and commission tracking. This cannot be undone.', confirmLabel: 'Remove', variant: 'danger', safetyText: 'REMOVE' });
                if (!ok) return;
                setLoading(true);
                setError('');
                try {
                  await partnersApi.demote(projectId, customer.id);
                  onUpdate();
                } catch (err) {
                  setError(getErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Removing...' : 'Remove Partner'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center px-5 py-3.5 border-b border-border-default">
        <span className="text-[13px] font-bold text-text-primary tracking-wide">Partner Program</span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[13px] text-text-muted mb-4 leading-relaxed">Promote this customer to partner to earn commission on referral orders.</p>
        {error && <Alert className="mb-3">{error}</Alert>}
        <div className="flex items-center gap-3 mt-auto">
          <label className="text-[12px] text-text-muted font-medium">Commission %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            className="bg-[#f59e0b] text-white border-none px-5 py-2 rounded-lg cursor-pointer text-[12px] font-bold font-sans transition-all duration-200 shadow-[0_0_16px_rgba(245,158,11,0.25)] hover:shadow-[0_0_24px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:shadow-none"
            disabled={loading || !commission}
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                await partnersApi.promote(projectId, customer.id, parseFloat(commission));
                onUpdate();
              } catch (err) {
                setError(getErrorMessage(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Promoting...' : 'Make Partner'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, canEdit } = useProject();
  const pid = currentProject?.id;
  const { data, loading, error, refresh } = useFetch(
    useCallback(() => dashboardApi.getCustomer(pid!, id!), [pid, id]),
    [pid, id],
  );
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!pid) return <NoProject />;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading customer...</div>;
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <div className="text-center p-5 text-text-muted">Customer not found.</div>;

  const customer = data.customer || {};
  const history = data.history || [];
  const directReferrals = data.directReferrals || [];
  const referredByCustomer = data.referredByCustomer;
  const grandparent = data.grandparent;

  async function handleAward({ points, reason }: { points: number; reason: string }) {
    setActionMessage(null);
    try {
      await dashboardApi.awardPoints(pid!, id!, points, reason);
      setActionMessage({ type: 'success', text: `Awarded ${points} points.` });
      refresh();
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: getErrorMessage(err) || 'Failed to award points.' });
    }
  }

  async function handleDeduct({ points, reason }: { points: number; reason: string }) {
    setActionMessage(null);
    try {
      await dashboardApi.deductPoints(pid!, id!, points, reason);
      setActionMessage({ type: 'success', text: `Deducted ${points} points.` });
      refresh();
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: getErrorMessage(err) || 'Failed to deduct points.' });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <CustomerHero customer={customer} />

      <CustomerProfile customer={customer} referredByCustomer={referredByCustomer} />

      {actionMessage && (
        <Alert variant={actionMessage.type === 'success' ? 'success' : 'error'}>
          {actionMessage.text}
        </Alert>
      )}

      {canEdit && (
        <div className={`grid ${currentProject?.partnersEnabled ? 'grid-cols-2 max-[900px]:grid-cols-1' : 'grid-cols-1'} gap-5 items-stretch`}>
          <ManualActions onAward={handleAward} onDeduct={handleDeduct} />
          {currentProject?.partnersEnabled && (
            <PartnerActions customer={customer} projectId={pid!} onUpdate={refresh} />
          )}
        </div>
      )}

      {(currentProject?.referralsEnabled || customer.is_partner) && (
        <ReferralTabs
          customer={customer}
          referredByCustomer={referredByCustomer}
          grandparent={grandparent}
          directReferrals={directReferrals}
          isPartner={!!customer.is_partner}
          projectId={pid!}
          customerId={customer.id}
        />
      )}

      <CustomerHistory history={history} />
    </div>
  );
}
