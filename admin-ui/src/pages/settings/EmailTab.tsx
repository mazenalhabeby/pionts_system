import React, { useCallback, useState, useEffect } from 'react';
import { dashboardApi, getErrorMessage } from '../../api';
import { useFetch } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { Toggle } from './shared';

const NOTIFICATION_MODE_OPTIONS = [
  { value: 'instant', label: 'Instant', desc: 'Send email immediately when points are earned', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
  ) },
  { value: 'digest', label: 'Daily Digest', desc: 'Combine all daily activity into a single summary email', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ) },
  { value: 'off', label: 'Off', desc: 'Do not send points notification emails', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  ) },
];

const EMAIL_TOGGLES = [
  { key: 'email_welcome_enabled', label: 'Welcome Email', desc: 'Send a welcome email when a new customer signs up', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  ) },
  { key: 'email_referral_enabled', label: 'Referral Notifications', desc: 'Notify referrers when someone signs up using their code', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ) },
];

export default function EmailTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
  const { data: settingsData, loading, error, refresh } = useFetch(
    useCallback(() => dashboardApi.getSettings(pid), [pid]),
    [pid],
  );

  const settings = settingsData?.settings || {};
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setForm({
      email_notification_mode: String(settings.email_notification_mode || 'instant'),
      email_welcome_enabled: String(settings.email_welcome_enabled || 'true'),
      email_referral_enabled: String(settings.email_referral_enabled || 'true'),
      email_from_name: String(settings.email_from_name || ''),
    });
  }, [settings]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      await dashboardApi.saveSettings(pid, { ...settings as Record<string, string>, ...form });
      refresh();
      setMessage({ type: 'success', text: 'Email settings saved.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center p-10 text-text-muted">Loading email settings...</div>;
  if (error) return <Alert>{error}</Alert>;

  const notifMode = form.email_notification_mode || 'instant';

  return (
    <div className="flex flex-col gap-5">
      {message && <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>}

      {/* ── Points Notification Mode ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Points Notifications</div>
            <div className="text-[12px] text-text-muted mt-0.5">How customers are notified when they earn points</div>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {NOTIFICATION_MODE_OPTIONS.map((opt) => {
              const selected = notifMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => updateField('email_notification_mode', opt.value)}
                  className={`text-left bg-bg-surface border rounded-xl px-5 py-4 transition-all duration-200 cursor-pointer ${
                    selected
                      ? 'border-accent/50 ring-1 ring-accent/20'
                      : 'border-border-default hover:border-border-focus/50'
                  } ${!canEdit ? 'opacity-60 !cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                      style={selected
                        ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }
                        : { background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }
                      }
                    >
                      {opt.icon}
                    </div>
                    {selected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-success bg-success-dim">Active</span>
                    )}
                  </div>
                  <div className="text-[13px] font-bold text-text-primary">{opt.label}</div>
                  <div className="text-[11px] text-text-faint mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Email Toggles ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Automated Emails</div>
            <div className="text-[12px] text-text-muted mt-0.5">Control which automated emails are sent to customers</div>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>
        <div className="divide-y divide-border-default">
          {EMAIL_TOGGLES.map((toggle) => {
            const enabled = form[toggle.key] === 'true';
            return (
              <div key={toggle.key} className="px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                    style={enabled
                      ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }
                      : { background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }
                    }
                  >
                    {toggle.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[14px] font-bold text-text-primary">{toggle.label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors duration-300 ${
                        enabled ? 'text-success bg-success-dim' : 'text-text-faint bg-bg-surface-raised'
                      }`}>
                        {enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className="text-[12px] text-text-muted mt-0.5">{toggle.desc}</div>
                  </div>
                </div>
                <Toggle checked={enabled} onChange={(v) => updateField(toggle.key, v ? 'true' : 'false')} disabled={!canEdit} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sender Identity ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Sender Identity</div>
            <div className="text-[12px] text-text-muted mt-0.5">Customize how emails appear to recipients</div>
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-2">From Name</div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={form.email_from_name || ''}
              onChange={(e) => updateField('email_from_name', e.target.value)}
              placeholder="e.g. My Store Rewards"
              disabled={!canEdit}
              className="flex-1 bg-bg-surface border border-border-default text-text-primary px-4 py-2.5 rounded-lg text-[13px] font-sans outline-none transition-colors duration-150 focus:border-border-focus placeholder:text-text-faint/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="text-[11px] text-text-faint mt-2">The name displayed in the "From" field of outgoing emails. Leave empty to use your project name.</div>
        </div>
      </div>

      {/* ── Save ── */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-text-primary text-bg-page px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
