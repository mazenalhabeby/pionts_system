import React, { useCallback, useState, useEffect } from 'react';
import { dashboardApi, getErrorMessage } from '../../api';
import { useFetch } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';

const COLOR_FIELDS = [
  { key: 'widget_primary_color', label: 'Primary', help: 'Buttons, links, and accents', fallback: '#ff3c00' },
  { key: 'widget_bg_color', label: 'Background', help: 'Widget panel background', fallback: '#050505' },
  { key: 'widget_text_color', label: 'Text', help: 'Primary text color', fallback: '#f2f2f2' },
] as const;

export default function WidgetTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
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
      widget_brand_name: String(settings.widget_brand_name || ''),
      widget_primary_color: String(settings.widget_primary_color || '#ff3c00'),
      widget_bg_color: String(settings.widget_bg_color || '#050505'),
      widget_text_color: String(settings.widget_text_color || '#f2f2f2'),
      referral_base_url: String(settings.referral_base_url || ''),
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
      setMessage({ type: 'success', text: 'Widget settings saved.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center p-10 text-text-muted">Loading widget settings...</div>;
  if (error) return <Alert>{error}</Alert>;

  const primary = form.widget_primary_color || '#ff3c00';
  const bg = form.widget_bg_color || '#050505';
  const txt = form.widget_text_color || '#f2f2f2';
  const brandName = form.widget_brand_name || 'Your Store';

  return (
    <div className="flex flex-col gap-6">
      {message && <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>}

      {/* ── Branding ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-bold text-text-primary">Branding</div>
              <div className="text-[12px] text-text-muted mt-0.5">Your brand identity shown in the widget</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-2.5">Brand Name</div>
          <input
            type="text"
            value={form.widget_brand_name || ''}
            onChange={(e) => updateField('widget_brand_name', e.target.value)}
            placeholder="e.g. My Store"
            disabled={!canEdit}
            className="w-full bg-bg-surface border border-border-default text-text-primary px-4 py-3 rounded-xl text-[14px] font-sans outline-none transition-all duration-200 focus:border-border-focus focus:ring-2 focus:ring-accent/10 placeholder:text-text-faint/50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="text-[11px] text-text-faint mt-2.5">Displayed in the widget header greeting</div>
          <div className="mt-5 pt-5 border-t border-border-default">
            <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-2.5">Referral Base URL</div>
            <input
              type="text"
              value={form.referral_base_url || ''}
              onChange={(e) => updateField('referral_base_url', e.target.value)}
              placeholder="https://yourstore.com/pages/rewards/"
              disabled={!canEdit}
              className="w-full bg-bg-surface border border-border-default text-text-primary px-4 py-3 rounded-xl text-[14px] font-sans outline-none transition-all duration-200 focus:border-border-focus focus:ring-2 focus:ring-accent/10 placeholder:text-text-faint/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="text-[11px] text-text-faint mt-2.5">Full URL used for referral links (e.g. https://yourstore.com/de/pages/rewards/). The referral code (?ref=CODE) is appended automatically.</div>
          </div>
        </div>
      </div>

      {/* ── Colors ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 14px rgba(249,115,22,0.25)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="15.5" r="2.5" /><circle cx="8.5" cy="15.5" r="2.5" />
                <path d="M3 19.78V2h18v17.78" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-bold text-text-primary">Colors</div>
              <div className="text-[12px] text-text-muted mt-0.5">Customize the widget color scheme</div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-5 max-sm:grid-cols-1">
            {COLOR_FIELDS.map((cf) => {
              const val = form[cf.key] || cf.fallback;
              return (
                <div key={cf.key} className="flex flex-col items-center text-center">
                  <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-3">{cf.label}</div>
                  {/* Color swatch circle */}
                  <label className="relative group cursor-pointer mb-3">
                    <input
                      type="color"
                      value={val}
                      onChange={(e) => updateField(cf.key, e.target.value)}
                      disabled={!canEdit}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div
                      className="w-16 h-16 rounded-2xl border-2 border-border-default transition-all duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: val,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.12)`,
                      }}
                    />
                    {/* Hover edit hint */}
                    <div className="absolute inset-0 w-16 h-16 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                  </label>
                  {/* Hex input */}
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateField(cf.key, e.target.value)}
                    disabled={!canEdit}
                    maxLength={7}
                    className="w-24 text-center bg-bg-surface border border-border-default text-text-primary px-2 py-1.5 rounded-lg text-[12px] font-mono outline-none transition-all duration-200 focus:border-border-focus focus:ring-2 focus:ring-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="text-[10px] text-text-faint mt-2">{cf.help}</div>
                </div>
              );
            })}
          </div>

          {/* ── Live Widget Preview ── */}
          <div className="mt-7 pt-5 border-t border-border-default">
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-[11px] text-text-faint font-semibold uppercase tracking-wider">Live Preview</span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ backgroundColor: bg, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              {/* Widget header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] font-medium opacity-60" style={{ color: txt }}>Welcome back to</div>
                    <div className="text-[16px] font-bold" style={{ color: txt }}>{brandName}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: primary + '22' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                {/* Points display */}
                <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: txt + '08' }}>
                  <div className="text-[11px] font-medium uppercase tracking-wider opacity-50 mb-1" style={{ color: txt }}>Your balance</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-extrabold leading-none" style={{ color: primary }}>150</span>
                    <span className="text-[12px] font-semibold opacity-50" style={{ color: txt }}>points</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: txt + '10' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: '60%', background: `linear-gradient(90deg, ${primary}, ${primary}cc)` }} />
                  </div>
                  <div className="text-[10px] mt-1.5 opacity-40" style={{ color: txt }}>50 pts to next reward</div>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2">
                  <div
                    className="flex-1 text-center py-2.5 rounded-lg text-[12px] font-bold cursor-default"
                    style={{ backgroundColor: primary, color: '#fff' }}
                  >
                    Redeem Points
                  </div>
                  <div
                    className="flex-1 text-center py-2.5 rounded-lg text-[12px] font-bold cursor-default"
                    style={{ backgroundColor: txt + '10', color: txt }}
                  >
                    Earn More
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      {canEdit && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="relative overflow-hidden bg-text-primary text-bg-page px-7 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer border-none"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving...
              </span>
            ) : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
