import React, { useCallback, useState, useEffect } from 'react';
import { dashboardApi, getErrorMessage } from '../../api';
import { useFetch, PlusIcon } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { useConfirm } from '../../components/ui/confirm-dialog';
import { Toggle, InlineEdit } from './shared';

interface GamTier {
  label: string;
  threshold: number;
  multiplier: number;
}

const TIER_GRADIENTS = [
  'linear-gradient(135deg, #b45309, #d97706)',
  'linear-gradient(135deg, #6b7280, #9ca3af)',
  'linear-gradient(135deg, #eab308, #f59e0b)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #dc2626, #f87171)',
  'linear-gradient(135deg, #0891b2, #67e8f9)',
  'linear-gradient(135deg, #db2777, #f472b6)',
];

function parseTiers(raw?: string): GamTier[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((t: any) => ({ label: String(t.label || ''), threshold: Number(t.threshold) || 0, multiplier: Number(t.multiplier) || 1 }));
  } catch { /* fall through */ }
  return [];
}

export default function GamificationTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
  const confirm = useConfirm();
  const { data: settingsData, loading, error, refresh } = useFetch(
    useCallback(() => dashboardApi.getSettings(pid), [pid]),
    [pid],
  );

  const settings = settingsData?.settings || {};
  const [tiersEnabled, setTiersEnabled] = useState(false);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [tiers, setTiers] = useState<GamTier[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTiersEnabled(settings.gamification_enabled === 'true');
    setLeaderboardEnabled(settings.leaderboard_enabled === 'true');
    const parsed = parseTiers(settings.gamification_tiers);
    setTiers(parsed.length > 0 ? parsed : [
      { label: 'Bronze', threshold: 0, multiplier: 1 },
      { label: 'Silver', threshold: 200, multiplier: 1.5 },
      { label: 'Gold', threshold: 500, multiplier: 2 },
    ]);
  }, [settings]);

  function updateTier(index: number, field: keyof GamTier, value: string) {
    setTiers((prev) => prev.map((t, i) => i === index ? { ...t, [field]: field === 'label' ? value : Number(value) || 0 } : t));
  }

  function addTier() {
    const last = tiers[tiers.length - 1];
    setTiers((prev) => [...prev, {
      label: `Tier ${prev.length + 1}`,
      threshold: last ? last.threshold + 200 : 0,
      multiplier: last ? Math.round((last.multiplier + 0.5) * 10) / 10 : 1,
    }]);
  }

  async function removeTier(index: number) {
    if (tiers.length <= 1) return;
    const ok = await confirm({ title: 'Remove tier', message: `Remove "${tiers[index].label}" tier? This cannot be undone.`, confirmLabel: 'Remove', variant: 'danger' });
    if (!ok) return;
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
      await dashboardApi.saveSettings(pid, {
        ...settings as Record<string, string>,
        gamification_enabled: tiersEnabled ? 'true' : 'false',
        leaderboard_enabled: leaderboardEnabled ? 'true' : 'false',
        gamification_tiers: JSON.stringify(sorted),
      });
      refresh();
      setMessage({ type: 'success', text: 'Gamification settings saved.' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center p-10 text-text-muted">Loading gamification settings...</div>;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="flex flex-col gap-5">
      {message && <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>}

      {/* ── Tiers Master Toggle ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
              style={tiersEnabled
                ? { background: 'linear-gradient(135deg, #eab308, #f59e0b)', color: '#fff', boxShadow: '0 4px 12px rgba(234,179,8,0.2)' }
                : { background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }
              }
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-bold text-text-primary">Loyalty Tiers</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors duration-300 ${
                  tiersEnabled ? 'text-success bg-success-dim' : 'text-text-faint bg-bg-surface-raised'
                }`}>
                  {tiersEnabled ? 'Active' : 'Off'}
                </span>
              </div>
              <div className="text-[12px] text-text-muted mt-0.5">Reward loyal customers with tier-based multipliers</div>
            </div>
          </div>
          <Toggle checked={tiersEnabled} onChange={setTiersEnabled} disabled={!canEdit} />
        </div>
      </div>

      {/* ── Tier Cards ── */}
      {tiersEnabled && (
        <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-text-primary">Tier Configuration</div>
              <div className="text-[12px] text-text-muted mt-0.5">Set names, thresholds, and point multipliers for each tier</div>
            </div>
            <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md tabular-nums">
              {tiers.length} {tiers.length === 1 ? 'tier' : 'tiers'}
            </span>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {tiers.map((tier, index) => {
              const grad = TIER_GRADIENTS[index % TIER_GRADIENTS.length];
              return (
                <div key={index} className="bg-bg-surface border border-border-default rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap transition-all duration-200 group/tier">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
                    style={{ background: grad }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15l-2 5-1-3H6l3-2-1-3 4 3 4-3-1 3 3 2h-3l-1 3z" /><circle cx="12" cy="8" r="6" />
                    </svg>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-[120px]">
                    <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-1">Name</div>
                    <InlineEdit
                      value={tier.label}
                      onSave={(val) => updateTier(index, 'label', val)}
                      className="font-semibold"
                      disabled={!canEdit}
                    />
                  </div>

                  {/* Threshold */}
                  <div className="min-w-[90px]">
                    <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-1">Threshold</div>
                    <div className="flex items-center gap-1 bg-bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
                      <InlineEdit
                        value={String(tier.threshold)}
                        onSave={(val) => updateTier(index, 'threshold', val)}
                        type="number"
                        disabled={!canEdit}
                      />
                      <span className="text-[11px] text-text-faint font-medium">pts</span>
                    </div>
                  </div>

                  {/* Multiplier */}
                  <div className="min-w-[90px]">
                    <div className="text-[11px] text-text-faint font-semibold uppercase tracking-wider mb-1">Multiplier</div>
                    <div className="flex items-center gap-1 bg-bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
                      <InlineEdit
                        value={String(tier.multiplier)}
                        onSave={(val) => updateTier(index, 'multiplier', val)}
                        disabled={!canEdit}
                      />
                      <span className="text-[11px] text-text-faint font-medium">x</span>
                    </div>
                  </div>

                  {/* Remove */}
                  {canEdit && tiers.length > 1 && (
                    <button
                      type="button"
                      className="opacity-0 group-hover/tier:opacity-100 transition-opacity duration-150 w-8 h-8 rounded-lg flex items-center justify-center text-text-faint hover:text-error hover:bg-error-dim cursor-pointer border-none bg-transparent shrink-0"
                      onClick={() => removeTier(index)}
                      title="Remove tier"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add tier */}
            {canEdit && (
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-border-default rounded-xl text-[13px] font-semibold text-text-muted hover:text-text-primary hover:border-border-focus transition-colors duration-150 cursor-pointer bg-transparent"
                onClick={addTier}
              >
                <PlusIcon size={15} />
                Add Tier
              </button>
            )}

            {/* Visual progression */}
            {tiers.length > 0 && (
              <div className="flex items-center gap-2 mt-2 px-1">
                {tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center flex-1 gap-1">
                      <div className="w-full h-1.5 rounded-full" style={{ background: TIER_GRADIENTS[i % TIER_GRADIENTS.length] }} />
                      <span className="text-[10px] text-text-faint font-medium truncate max-w-full">{tier.label}</span>
                    </div>
                    {i < tiers.length - 1 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint shrink-0 -mt-4">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
              style={leaderboardEnabled
                ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }
                : { background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }
              }
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-bold text-text-primary">Leaderboard</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors duration-300 ${
                  leaderboardEnabled ? 'text-success bg-success-dim' : 'text-text-faint bg-bg-surface-raised'
                }`}>
                  {leaderboardEnabled ? 'Active' : 'Off'}
                </span>
              </div>
              <div className="text-[12px] text-text-muted mt-0.5">Show a public leaderboard of top referrers in the widget</div>
            </div>
          </div>
          <Toggle checked={leaderboardEnabled} onChange={setLeaderboardEnabled} disabled={!canEdit} />
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
