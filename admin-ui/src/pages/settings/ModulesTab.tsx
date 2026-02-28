import React, { useState } from 'react';
import { projectApi, getErrorMessage } from '../../api';
import { useProject } from '../../context/ProjectContext';
import { Alert } from '../../components/ui/alert';
import { Toggle } from './shared';

const MODULE_DEFS = [
  {
    key: 'pointsEnabled',
    title: 'Points System',
    subtitle: 'Loyalty rewards engine',
    description: 'Customers earn points for purchases, sign-ups, reviews, social follows, and more. Points can be redeemed for discounts.',
    features: ['Purchase rewards', 'Social actions', 'Redemption tiers', 'Birthday bonuses'],
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: 'referralsEnabled',
    title: 'Referral Program',
    subtitle: '3-level referral chain',
    description: 'Customers earn points when their referrals make purchases. Supports up to 3 levels of referral depth.',
    features: ['Referral links', 'Multi-level rewards', 'Anti-abuse rules', 'Network tracking'],
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'partnersEnabled',
    title: 'Partner Program',
    subtitle: 'Commission-based affiliates',
    description: 'Promote top referrers to partners with custom commission rates and dedicated tracking dashboards.',
    features: ['Custom commissions', 'Earnings tracking', 'Partner promotion', 'Performance analytics'],
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

export default function ModulesTab({ pid, canEdit }: { pid: number; canEdit: boolean }) {
  const { currentProject, refreshProjects } = useProject();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(key: string, newValue: boolean) {
    setSaving(key);
    setError(null);
    try {
      await projectApi.update(pid, { [key]: newValue });
      await refreshProjects();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert className="mb-1">{error}</Alert>}
      {MODULE_DEFS.map((mod) => {
        const enabled = (currentProject as any)?.[mod.key] ?? false;
        const isSaving = saving === mod.key;
        return (
          <div
            key={mod.key}
            className={`bg-bg-card border rounded-2xl overflow-hidden transition-all duration-300 ${
              enabled ? 'border-border-focus/60' : 'border-border-default'
            }`}
          >
            <div className="px-6 py-5 max-md:px-4 max-md:py-4">
              {/* Top row: icon + title + toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                    style={enabled
                      ? { background: mod.gradient, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                      : { background: 'var(--color-bg-surface-raised)', color: 'var(--color-text-faint)' }
                    }
                  >
                    {mod.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] font-bold text-text-primary">{mod.title}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors duration-300 ${
                          enabled
                            ? 'text-success bg-success-dim'
                            : 'text-text-faint bg-bg-surface-raised'
                        }`}
                      >
                        {enabled ? 'Active' : 'Off'}
                      </span>
                    </div>
                    <div className={`text-[12px] font-medium mt-0.5 ${enabled ? 'text-text-muted' : 'text-text-faint'}`}>
                      {mod.subtitle}
                    </div>
                  </div>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(v) => handleToggle(mod.key, v)}
                  disabled={!canEdit || isSaving}
                />
              </div>

              {/* Description */}
              <p className="text-[13px] text-text-muted leading-relaxed mt-3 ml-[60px] max-md:ml-0">
                {mod.description}
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-1.5 mt-3 ml-[60px] max-md:ml-0">
                {mod.features.map((f) => (
                  <span
                    key={f}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors duration-300 ${
                      enabled ? 'text-text-secondary bg-bg-surface border-border-default' : 'text-text-faint bg-bg-surface-raised border-border-subtle'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
