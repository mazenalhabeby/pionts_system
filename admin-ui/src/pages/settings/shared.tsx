import React, { useState, useEffect } from 'react';

// ─── Local Interfaces ───

export interface EarnAction {
  id: number;
  slug: string;
  label: string;
  points: number;
  category: 'predefined' | 'social_follow' | 'custom';
  frequency: string;
  enabled: boolean;
  socialUrl?: string;
}

export interface RedemptionTier {
  id: number;
  points: number;
  discount: number;
}

export interface ReferralLevel {
  id: number;
  level: number;
  points: number;
}

export interface TabDef {
  key: string;
  label: string;
  requiresModule?: 'points' | 'referrals' | 'partners';
  adminOnly?: boolean;
}

// ─── Tab Definitions ───

export const TABS: TabDef[] = [
  { key: 'modules', label: 'Modules' },
  { key: 'points', label: 'Points', requiresModule: 'points' },
  { key: 'referrals', label: 'Referrals', requiresModule: 'referrals' },
  { key: 'partners', label: 'Partners', requiresModule: 'partners' },
  { key: 'gamification', label: 'Gamification', requiresModule: 'points' },
  { key: 'email', label: 'Email' },
  { key: 'team', label: 'Team', adminOnly: true },
];

// ─── Toggle Switch Component ───

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-primary' : 'bg-border-default'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Inline Editable Field ───

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  className = '',
  disabled = false,
}: {
  value: string | number;
  onSave: (val: string) => void;
  type?: 'text' | 'number';
  className?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    setEditing(false);
    if (draft !== String(value)) {
      onSave(draft);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setDraft(String(value));
      setEditing(false);
    }
  }

  if (disabled) {
    return <span className={`text-[13px] text-text-muted ${className}`}>{value}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`text-[13px] text-text-primary hover:text-accent cursor-pointer bg-transparent border-none p-0 text-left transition-colors duration-150 ${className}`}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      autoFocus
      className={`bg-bg-surface border border-border-focus text-text-primary px-2 py-0.5 rounded-md text-[13px] outline-none w-20 ${className}`}
    />
  );
}
