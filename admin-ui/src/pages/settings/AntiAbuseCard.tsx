import React, { useState, useEffect } from 'react';
import { getErrorMessage } from '../../api';
import { Alert } from '../../components/ui/alert';
import { InlineEdit } from './shared';

const ANTI_ABUSE_FIELDS = [
  { key: 'min_order_referral', label: 'Min order for referral', unit: 'EUR', desc: 'Minimum order amount to trigger referral points', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
  ) },
  { key: 'max_direct_referrals', label: 'Max direct referrals', unit: '', desc: 'Maximum number of direct referrals per customer', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ) },
  { key: 'points_expiry_months', label: 'Points expiry', unit: 'months', desc: 'Points expire after this many months of inactivity', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ) },
  { key: 'referral_discount_percent', label: 'New customer discount', unit: '%', desc: 'Discount given to new customers referred via a link', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2" /><circle cx="15" cy="15" r="2" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
  ) },
];

export default function AntiAbuseCard({ settings, canEdit, onSave }: { settings: Record<string, string | number>; canEdit: boolean; onSave: (s: Record<string, string>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const f of ANTI_ABUSE_FIELDS) {
      init[f.key] = settings[f.key] != null ? String(settings[f.key]) : '';
    }
    setForm(init);
  }, [settings]);

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ ...settings as Record<string, string>, ...form });
      setMessage({ type: 'success', text: 'Anti-abuse settings saved.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
        <div>
          <div className="text-[15px] font-bold text-text-primary">Anti-Abuse</div>
          <div className="text-[12px] text-text-muted mt-0.5">Limits and safeguards to prevent fraud and gaming</div>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      </div>
      <div className="p-5">
        {message && <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-3">{message.text}</Alert>}

        <div className="flex flex-col gap-2.5">
          {ANTI_ABUSE_FIELDS.map((field) => (
            <div
              key={field.key}
              className="bg-bg-surface border border-border-default rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap transition-all duration-200"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {field.icon}
              </div>
              <div className="flex-1 min-w-[140px]">
                <div className="text-[13px] text-text-primary font-semibold">{field.label}</div>
                <div className="text-[11px] text-text-faint mt-0.5">{field.desc}</div>
              </div>
              <div className="flex items-center gap-1.5 bg-bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
                <InlineEdit
                  value={form[field.key] || ''}
                  onSave={(val) => setForm((prev) => ({ ...prev, [field.key]: val }))}
                  type="number"
                  disabled={!canEdit}
                />
                {field.unit && <span className="text-[11px] text-text-faint font-medium">{field.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-text-primary text-bg-page px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
