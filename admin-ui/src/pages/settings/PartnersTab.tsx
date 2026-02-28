import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, getErrorMessage } from '../../api';
import { useFetch } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';

const REWARD_TYPE_OPTIONS = [
  { value: 'points', label: 'Points', desc: 'Partners earn loyalty points for referred orders', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ) },
  { value: 'credit', label: 'Store Credit', desc: 'Partners earn store credit for referred orders', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ) },
];

export default function PartnersTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
  const { data: settingsData, loading, error, refresh } = useFetch(
    useCallback(() => dashboardApi.getSettings(pid), [pid]),
    [pid],
  );
  const { data: partners } = useFetch(
    useCallback(() => import('../../api').then((m) => m.partnersApi.list(pid)), [pid]),
    [pid],
  );

  const settings = settingsData?.settings || {};
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentRewardType = String(settings.partner_reward_type || 'points');
  const partnerList = Array.isArray(partners) ? partners : [];
  const totalPartners = partnerList.length;
  const activePartners = partnerList.filter((p: any) => Number(p.total_orders || 0) > 0).length;
  const totalEarned = partnerList.reduce((s: number, p: any) => s + Number(p.total_earned || 0), 0);

  async function handleRewardTypeChange(value: string) {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      await dashboardApi.saveSettings(pid, { ...settings as Record<string, string>, partner_reward_type: value });
      refresh();
      setMessage({ type: 'success', text: 'Reward type updated.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center p-10 text-text-muted">Loading partner settings...</div>;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="flex flex-col gap-5">
      {message && <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>}

      {/* ── Overview Stats ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Overview</div>
            <div className="text-[12px] text-text-muted mt-0.5">Current partner program stats</div>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-3 max-sm:grid-cols-1 divide-x divide-border-default max-sm:divide-x-0 max-sm:divide-y">
          {[
            { label: 'Total Partners', value: String(totalPartners), icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            ) },
            { label: 'Active Partners', value: String(activePartners), icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            ) },
            { label: 'Total Earned', value: `\u20AC${totalEarned.toFixed(2)}`, accent: true, icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            ) },
          ].map((s) => (
            <div key={s.label} className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-text-faint">{s.icon}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-faint">{s.label}</span>
              </div>
              <div className={`text-[22px] font-bold leading-none ${s.accent ? 'text-success' : 'text-text-primary'}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reward Type ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Reward Type</div>
            <div className="text-[12px] text-text-muted mt-0.5">How partners are compensated for referrals</div>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8" /><line x1="12" y1="6" x2="12" y2="18" />
            </svg>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            {REWARD_TYPE_OPTIONS.map((opt) => {
              const selected = currentRewardType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() => handleRewardTypeChange(opt.value)}
                  className={`text-left bg-bg-surface border rounded-xl px-5 py-4 transition-all duration-200 cursor-pointer ${
                    selected
                      ? 'border-accent/50 ring-1 ring-accent/20'
                      : 'border-border-default hover:border-border-focus/50'
                  } ${!canEdit ? 'opacity-60 !cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                      style={selected
                        ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff' }
                        : { background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }
                      }
                    >
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-text-primary">{opt.label}</span>
                        {selected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-success bg-success-dim">Active</span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-faint mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">How It Works</div>
            <div className="text-[12px] text-text-muted mt-0.5">Partner program flow</div>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-3">
            {[
              { step: '1', title: 'Promote a customer', desc: 'Go to a customer\'s detail page and promote them to partner status' },
              { step: '2', title: 'Set commission rate', desc: 'Each partner gets a custom commission percentage on referred orders' },
              { step: '3', title: 'Track earnings', desc: 'Partners earn commission automatically when their referrals make purchases' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-bg-surface border border-border-default rounded-xl px-5 py-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-extrabold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {item.step}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-text-primary">{item.title}</div>
                  <div className="text-[11px] text-text-faint mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Link ── */}
      <Link
        to="/partners"
        className="flex items-center justify-between bg-bg-card border border-border-default rounded-2xl px-6 py-5 transition-all duration-200 hover:border-accent/40 no-underline group"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white transition-shadow duration-200 group-hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold text-text-primary">Manage Partners</div>
            <div className="text-[12px] text-text-muted mt-0.5">View commissions, earnings, and promote customers</div>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint group-hover:text-accent transition-colors shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}
