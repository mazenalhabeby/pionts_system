import React, { useCallback, useState } from 'react';
import { earnActionsApi, redemptionTiersApi, getErrorMessage } from '../../api';
import { useFetch, PlusIcon } from '@pionts/shared';
import { Alert } from '../../components/ui/alert';
import { useConfirm } from '../../components/ui/confirm-dialog';
import { Toggle, InlineEdit } from './shared';
import type { EarnAction, RedemptionTier } from './shared';

const CATEGORY_META: Record<string, { label: string; gradient: string; icon: React.ReactNode }> = {
  predefined: {
    label: 'Core',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  social_follow: {
    label: 'Social',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  custom: {
    label: 'Custom',
    gradient: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
};

export default function PointsTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
  const confirm = useConfirm();
  const { data: actions, loading: actionsLoading, error: actionsError, refresh: refreshActions } = useFetch<EarnAction[]>(
    useCallback(() => earnActionsApi.list(pid), [pid]),
    [pid],
  );

  const { data: tiers, loading: tiersLoading, error: tiersError, refresh: refreshTiers } = useFetch<RedemptionTier[]>(
    useCallback(() => redemptionTiersApi.list(pid), [pid]),
    [pid],
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [tierError, setTierError] = useState<string | null>(null);
  const [newTierPoints, setNewTierPoints] = useState('');
  const [newTierDiscount, setNewTierDiscount] = useState('');
  const [addingTier, setAddingTier] = useState(false);
  const [addingAction, setAddingAction] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionLabel, setNewActionLabel] = useState('');
  const [newActionPoints, setNewActionPoints] = useState('');
  const [newActionFrequency, setNewActionFrequency] = useState('unlimited');
  const [newActionUrl, setNewActionUrl] = useState('');

  // ── Earn Action Handlers ──

  async function handleActionUpdate(actionId: number, data: Record<string, unknown>) {
    setActionError(null);
    try {
      await earnActionsApi.update(pid, actionId, data);
      refreshActions();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    }
  }

  async function handleActionDelete(actionId: number) {
    const ok = await confirm({ title: 'Delete action', message: 'This custom action will be permanently removed. This cannot be undone.', confirmLabel: 'Delete', variant: 'danger', safetyText: 'DELETE' });
    if (!ok) return;
    setActionError(null);
    try {
      await earnActionsApi.remove(pid, actionId);
      refreshActions();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    }
  }

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!newActionLabel.trim() || !newActionPoints) return;
    setAddingAction(true);
    setActionError(null);
    try {
      const payload: Record<string, unknown> = {
        label: newActionLabel.trim(),
        points: parseInt(newActionPoints, 10),
        category: 'custom',
        frequency: newActionFrequency,
        enabled: true,
      };
      if (newActionUrl.trim()) payload.socialUrl = newActionUrl.trim();
      await earnActionsApi.create(pid, payload);
      setNewActionLabel('');
      setNewActionPoints('');
      setNewActionFrequency('unlimited');
      setNewActionUrl('');
      setShowAddForm(false);
      refreshActions();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setAddingAction(false);
    }
  }

  // ── Tier Handlers ──

  async function handleAddTier(e: React.FormEvent) {
    e.preventDefault();
    if (!newTierPoints || !newTierDiscount) return;
    setAddingTier(true);
    setTierError(null);
    try {
      await redemptionTiersApi.create(pid, {
        points: parseInt(newTierPoints, 10),
        discount: parseFloat(newTierDiscount),
      });
      setNewTierPoints('');
      setNewTierDiscount('');
      refreshTiers();
    } catch (err: unknown) {
      setTierError(getErrorMessage(err));
    } finally {
      setAddingTier(false);
    }
  }

  async function handleTierDelete(tierId: number) {
    const ok = await confirm({ title: 'Delete tier', message: 'This redemption tier will be permanently removed. This cannot be undone.', confirmLabel: 'Delete', variant: 'danger', safetyText: 'DELETE' });
    if (!ok) return;
    setTierError(null);
    try {
      await redemptionTiersApi.remove(pid, tierId);
      refreshTiers();
    } catch (err: unknown) {
      setTierError(getErrorMessage(err));
    }
  }

  async function handleTierUpdate(tierId: number, data: Record<string, unknown>) {
    setTierError(null);
    try {
      await redemptionTiersApi.update(pid, tierId, data);
      refreshTiers();
    } catch (err: unknown) {
      setTierError(getErrorMessage(err));
    }
  }

  const loading = actionsLoading || tiersLoading;
  if (loading) return <div className="text-center p-10 text-text-muted">Loading points settings...</div>;

  const combinedError = actionsError || tiersError;
  if (combinedError) return <Alert>{combinedError}</Alert>;

  const actionList: EarnAction[] = actions || [];
  const tierList: RedemptionTier[] = tiers || [];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Earn Actions ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Earn Actions</div>
            <div className="text-[12px] text-text-muted mt-0.5">Configure how customers earn points</div>
          </div>
          <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md tabular-nums">
            {actionList.length} action{actionList.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-5">
          {actionError && <Alert className="mb-3">{actionError}</Alert>}

          <div className="flex flex-col gap-2.5">
            {actionList.map((action) => {
              const meta = CATEGORY_META[action.category];
              return (
                <div
                  key={action.id}
                  className={`bg-bg-surface border rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap transition-all duration-200 ${
                    action.enabled ? 'border-border-default' : 'border-border-subtle opacity-60'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: action.enabled ? (meta?.gradient || 'var(--color-bg-surface-raised)') : 'var(--color-bg-surface-raised)', color: action.enabled ? '#fff' : 'var(--color-text-faint)' }}
                  >
                    {meta?.icon || <span className="text-[14px]">{'\u2022'}</span>}
                  </div>

                  {/* Label + meta */}
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      {action.category === 'predefined' ? (
                        <span className="text-[13px] text-text-primary font-semibold">{action.label}</span>
                      ) : (
                        <InlineEdit
                          value={action.label}
                          onSave={(val) => handleActionUpdate(action.id, { label: val })}
                          className="font-semibold"
                          disabled={!canEdit}
                        />
                      )}
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                        style={{ color: action.enabled ? 'var(--color-text-muted)' : 'var(--color-text-faint)', background: 'var(--color-bg-surface-raised)', borderColor: 'var(--color-border-subtle)' }}
                      >
                        {meta?.label || action.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-text-faint font-mono">{action.slug}</span>
                      <span className="text-[11px] text-text-faint">{action.frequency}</span>
                    </div>
                  </div>

                  {/* Social URL */}
                  {action.category === 'social_follow' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-text-faint">URL</span>
                      <InlineEdit
                        value={action.socialUrl || ''}
                        onSave={(val) => handleActionUpdate(action.id, { socialUrl: val })}
                        className="w-36"
                        disabled={!canEdit}
                      />
                    </div>
                  )}

                  {/* Points badge */}
                  <div className="flex items-center gap-1 bg-bg-surface-raised border border-border-default rounded-lg px-3 py-1.5">
                    <InlineEdit
                      value={action.points}
                      onSave={(val) => handleActionUpdate(action.id, { points: parseInt(val, 10) })}
                      type="number"
                      disabled={!canEdit}
                    />
                    <span className="text-[11px] text-text-faint font-medium">pts</span>
                  </div>

                  {/* Toggle */}
                  <Toggle
                    checked={action.enabled}
                    onChange={(v) => handleActionUpdate(action.id, { enabled: v })}
                    disabled={!canEdit}
                  />

                  {/* Delete */}
                  {action.category === 'custom' && canEdit && (
                    <button
                      type="button"
                      onClick={() => handleActionDelete(action.id)}
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

          {/* Add Custom Action */}
          {canEdit && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-bg-surface border border-dashed border-border-default rounded-xl text-[13px] font-medium text-text-muted cursor-pointer transition-all duration-200 hover:border-border-focus/50 hover:text-text-secondary"
            >
              <PlusIcon size={14} />
              Add Custom Action
            </button>
          )}
          {canEdit && showAddForm && (
            <form onSubmit={handleAddAction} className="mt-4 bg-bg-surface border border-border-default rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text-primary">New Custom Action</span>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewActionLabel(''); setNewActionPoints(''); setNewActionUrl(''); setNewActionFrequency('unlimited'); }}
                  className="text-text-faint hover:text-text-secondary bg-transparent border-none cursor-pointer p-1 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Write a review"
                      value={newActionLabel}
                      onChange={(e) => setNewActionLabel(e.target.value)}
                      className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none focus:border-border-focus transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Points</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={newActionPoints}
                      onChange={(e) => setNewActionPoints(e.target.value)}
                      className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none focus:border-border-focus transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Frequency</label>
                    <select
                      value={newActionFrequency}
                      onChange={(e) => setNewActionFrequency(e.target.value)}
                      className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none focus:border-border-focus transition-colors font-sans cursor-pointer"
                    >
                      <option value="unlimited">Unlimited</option>
                      <option value="repeatable">Repeatable</option>
                      <option value="one_time">One time</option>
                      <option value="yearly">Once per year</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">URL <span className="normal-case tracking-normal font-normal text-text-faint">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. https://instagram.com/yourpage"
                      value={newActionUrl}
                      onChange={(e) => setNewActionUrl(e.target.value)}
                      className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none focus:border-border-focus transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingAction || !newActionLabel.trim() || !newActionPoints}
                    className="flex items-center gap-1.5 bg-text-primary text-bg-page px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                  >
                    <PlusIcon size={14} />
                    {addingAction ? 'Adding...' : 'Add Action'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Redemption Tiers ── */}
      <div className="bg-bg-card border border-border-default rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Redemption Tiers</div>
            <div className="text-[12px] text-text-muted mt-0.5">Points-to-discount conversion rates</div>
          </div>
          <span className="text-[11px] font-semibold text-text-faint bg-bg-surface-raised border border-border-default px-2.5 py-0.5 rounded-md tabular-nums">
            {tierList.length} tier{tierList.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-5">
          {tierError && <Alert className="mb-3">{tierError}</Alert>}

          {tierList.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-[13px]">No redemption tiers configured.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              {tierList.map((tier) => (
                <div key={tier.id} className="bg-bg-surface border border-border-default rounded-xl px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-0.5">
                        <InlineEdit
                          value={tier.points}
                          onSave={(val) => handleTierUpdate(tier.id, { points: parseInt(val, 10) })}
                          type="number"
                          disabled={!canEdit}
                          className="!text-[18px] !font-extrabold"
                        />
                      </div>
                      <span className="text-[10px] text-text-faint font-medium uppercase tracking-wider">points</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-faint shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-0.5">
                        <InlineEdit
                          value={tier.discount}
                          onSave={(val) => handleTierUpdate(tier.id, { discount: parseFloat(val) })}
                          type="number"
                          disabled={!canEdit}
                          className="!text-[18px] !font-extrabold !text-success"
                        />
                      </div>
                      <span className="text-[10px] text-text-faint font-medium uppercase tracking-wider">off</span>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleTierDelete(tier.id)}
                      className="bg-transparent text-text-faint border border-border-subtle w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-150 hover:text-error hover:border-error/40"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Tier */}
          {canEdit && (
            <form onSubmit={handleAddTier} className="mt-4 flex items-center gap-2.5 flex-wrap bg-bg-surface border border-dashed border-border-default rounded-xl px-5 py-3.5">
              <input
                type="number"
                placeholder="Points"
                value={newTierPoints}
                onChange={(e) => setNewTierPoints(e.target.value)}
                className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none w-28 focus:border-border-focus transition-colors"
              />
              <input
                type="number"
                placeholder="Discount"
                step="0.01"
                value={newTierDiscount}
                onChange={(e) => setNewTierDiscount(e.target.value)}
                className="bg-bg-card border border-border-default text-text-primary px-3 py-2 rounded-lg text-[13px] outline-none w-28 focus:border-border-focus transition-colors"
              />
              <button
                type="submit"
                disabled={addingTier || !newTierPoints || !newTierDiscount}
                className="flex items-center gap-1.5 bg-text-primary text-bg-page px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                <PlusIcon size={14} />
                Add Tier
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
