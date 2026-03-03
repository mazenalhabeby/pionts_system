// Referrals settings tab — levels, base URL, anti-abuse
import React, { useCallback, useState, useEffect } from 'react';
import { dashboardApi, referralLevelsApi, getErrorMessage } from '../../api';
import { useFetch, PlusIcon } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { useConfirm } from '../../components/ui/confirm-dialog';
import { InlineEdit } from './shared';
import AntiAbuseCard from './AntiAbuseCard';
import type { ReferralLevel } from './shared';

const LEVEL_GRADIENTS = [
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
];

const LEVEL_LABELS: Record<number, { label: string; desc: string }> = {
  1: { label: 'The Buyer', desc: 'Points earned by the referred customer' },
  2: { label: 'The Referrer', desc: 'Points earned by the direct referrer' },
  3: { label: 'Grand-Referrer', desc: 'Points earned by the referrer\'s referrer' },
  4: { label: 'Great Grand-Referrer', desc: 'Points for the 4th level in the chain' },
  5: { label: 'Network Builder', desc: 'Reward for building a 5-deep network' },
  6: { label: 'Community Leader', desc: 'Reward for 6 levels of referral depth' },
  7: { label: 'Growth Champion', desc: 'Reward for 7 levels of referral depth' },
  8: { label: 'Ambassador', desc: 'Reward for 8 levels of referral depth' },
  9: { label: 'Elite Advocate', desc: 'Reward for 9 levels of referral depth' },
  10: { label: 'Legend', desc: 'Reward for reaching 10 levels deep' },
};

function getLevelMeta(level: number) {
  const labels = LEVEL_LABELS[level] || { label: `Depth ${level}`, desc: `Points for level ${level} in the referral chain` };
  const gradient = LEVEL_GRADIENTS[(level - 1) % LEVEL_GRADIENTS.length];
  return { ...labels, gradient };
}

export default function ReferralsTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
  const confirm = useConfirm();
  const { data: levels, loading: levelsLoading, error: levelsError, refresh: refreshLevels } = useFetch<ReferralLevel[]>(
    useCallback(() => referralLevelsApi.list(pid), [pid]),
    [pid],
  );

  const { data: settingsData, loading: settingsLoading, error: settingsError, refresh: refreshSettings } = useFetch(
    useCallback(() => dashboardApi.getSettings(pid), [pid]),
    [pid],
  );

  const [levelError, setLevelError] = useState<string | null>(null);
  const [newLevelNum, setNewLevelNum] = useState('');
  const [newLevelPoints, setNewLevelPoints] = useState('');
  const [addingLevel, setAddingLevel] = useState(false);
  const [showAddLevel, setShowAddLevel] = useState(false);

  const settings = settingsData?.settings || {};

  async function handleSettingsSave(updatedSettings: Record<string, string>) {
    await dashboardApi.saveSettings(pid, updatedSettings);
    refreshSettings();
  }

  async function handleAddLevel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLevelNum || !newLevelPoints) return;
    setAddingLevel(true);
    setLevelError(null);
    try {
      await referralLevelsApi.create(pid, {
        level: parseInt(newLevelNum, 10),
        points: parseInt(newLevelPoints, 10),
      });
      setNewLevelNum('');
      setNewLevelPoints('');
      setShowAddLevel(false);
      refreshLevels();
    } catch (err: unknown) {
      setLevelError(getErrorMessage(err));
    } finally {
      setAddingLevel(false);
    }
  }

  async function handleLevelDelete(levelId: number) {
    const ok = await confirm({ title: 'Delete level', message: 'This referral level will be permanently removed. This cannot be undone.', confirmLabel: 'Delete', variant: 'danger', safetyText: 'DELETE' });
    if (!ok) return;
    setLevelError(null);
    try {
      await referralLevelsApi.remove(pid, levelId);
      refreshLevels();
    } catch (err: unknown) {
      setLevelError(getErrorMessage(err));
    }
  }

  async function handleLevelUpdate(levelId: number, data: Record<string, unknown>) {
    setLevelError(null);
    try {
      await referralLevelsApi.update(pid, levelId, data);
      refreshLevels();
    } catch (err: unknown) {
      setLevelError(getErrorMessage(err));
    }
  }

  const loading = levelsLoading || settingsLoading;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading referral settings...</div>;

  const combinedError = levelsError || settingsError;
  if (combinedError) return <Alert>{combinedError}</Alert>;

  const levelList: ReferralLevel[] = levels || [];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Referral Levels ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Referral Levels</div>
            <div className="text-[12px] text-text-muted mt-0.5">Points awarded at each level of the referral chain</div>
          </div>
          <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md tabular-nums">
            {levelList.length} level{levelList.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-5">
          {levelError && <Alert className="mb-3">{levelError}</Alert>}

          {levelList.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-[13px]">No referral levels configured.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {levelList.map((lvl) => {
                const meta = getLevelMeta(lvl.level);
                return (
                  <div
                    key={lvl.id}
                    className="bg-bg-surface border border-border-default rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap transition-all duration-200"
                  >
                    {/* Level icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-extrabold text-sm"
                      style={{ background: meta.gradient }}
                    >
                      L{lvl.level}
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-text-primary font-semibold">Level {lvl.level}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border text-text-muted bg-bg-surface-raised border-border-subtle">
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-faint mt-0.5">{meta.desc}</div>
                    </div>

                    {/* Points badge */}
                    <div className="flex items-center gap-1 bg-bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
                      <InlineEdit
                        value={lvl.points}
                        onSave={(val) => handleLevelUpdate(lvl.id, { points: parseInt(val, 10) })}
                        type="number"
                        disabled={!canEdit}
                      />
                      <span className="text-[11px] text-text-faint font-medium">pts</span>
                    </div>

                    {/* Delete */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleLevelDelete(lvl.id)}
                        className="bg-transparent text-text-faint border border-border-subtle w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-150 hover:text-error hover:border-error/40"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Level */}
          {canEdit && !showAddLevel && (
            <button
              type="button"
              onClick={() => setShowAddLevel(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-bg-surface border border-dashed border-border-default rounded-xl text-[13px] font-medium text-text-muted cursor-pointer transition-all duration-200 hover:border-border-focus/50 hover:text-text-secondary"
            >
              <PlusIcon size={14} />
              Add Referral Level
            </button>
          )}
          {canEdit && showAddLevel && (
            <form onSubmit={handleAddLevel} className="mt-4 bg-bg-surface border border-border-default rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-primary">New Referral Level</span>
                <button
                  type="button"
                  onClick={() => { setShowAddLevel(false); setNewLevelNum(''); setNewLevelPoints(''); }}
                  className="text-text-faint hover:text-text-secondary bg-transparent border-none cursor-pointer p-1 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Level Number</label>
                    <input
                      type="number"
                      placeholder="e.g. 4"
                      value={newLevelNum}
                      onChange={(e) => setNewLevelNum(e.target.value)}
                      className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none focus:border-border-focus transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Points per Order</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={newLevelPoints}
                      onChange={(e) => setNewLevelPoints(e.target.value)}
                      className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none focus:border-border-focus transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingLevel || !newLevelNum || !newLevelPoints}
                    className="flex items-center gap-1.5 bg-text-primary text-bg-page px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                  >
                    <PlusIcon size={14} />
                    {addingLevel ? 'Adding...' : 'Add Level'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Referral Base URL ── */}
      <ReferralBaseUrlCard settings={settings} canEdit={canEdit} onSave={handleSettingsSave} />

      {/* ── Anti-Abuse Settings ── */}
      <AntiAbuseCard settings={settings} canEdit={canEdit} onSave={handleSettingsSave} />
    </div>
  );
}

function ReferralBaseUrlCard({ settings, canEdit, onSave }: { settings: Record<string, string>; canEdit: boolean; onSave: (s: Record<string, string>) => Promise<void> }) {
  const [url, setUrl] = useState(settings.referral_base_url || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(settings.referral_base_url || '');
  }, [settings.referral_base_url]);

  const dirty = url !== (settings.referral_base_url || '');

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ ...settings, referral_base_url: url.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default">
        <div className="text-[15px] font-bold text-text-primary">Referral Link</div>
        <div className="text-[12px] text-text-muted mt-0.5">The base URL used to generate referral links for customers</div>
      </div>
      <div className="p-5">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Referral Base URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourstore.com/de/pages/rewards/"
          disabled={!canEdit}
          className="mt-1.5 w-full bg-bg-surface border border-border-default text-text-primary px-4 py-3 rounded-xl text-[14px] font-sans outline-none transition-all duration-200 focus:border-border-focus focus:ring-2 focus:ring-accent/10 placeholder:text-text-faint/50 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="text-[11px] text-text-faint mt-2">
          Full URL including path. The referral code (<code className="text-[10px] bg-bg-surface-raised px-1 py-0.5 rounded">?ref=CODE</code>) is appended automatically.
        </div>
        {canEdit && dirty && (
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-text-primary text-bg-page px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
