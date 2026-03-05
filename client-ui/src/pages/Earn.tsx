import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';
import EarnItem from '../components/EarnItem';
import { StarIcon } from '@pionts/shared';
import type { EarnAction } from '@pionts/shared';
import { useI18n } from '../i18n';

// Fallback earn actions for backward compatibility (when API doesn't return earn_actions)
const FALLBACK_ACTIONS: (EarnAction & { legacyFlag?: string })[] = [
  { id: 0, slug: 'signup', label: 'Sign up', points: 20, category: 'predefined', frequency: 'one_time', enabled: true, sort_order: 0, legacyFlag: 'signup_rewarded' },
  { id: 0, slug: 'first_order', label: 'First order', points: 50, category: 'predefined', frequency: 'one_time', enabled: true, sort_order: 1, legacyFlag: 'first_order_rewarded' },
  { id: 0, slug: 'follow_tiktok', label: 'Follow us on TikTok', points: 10, category: 'social_follow', frequency: 'one_time', enabled: true, sort_order: 2, social_url: '', legacyFlag: 'followed_tiktok' },
  { id: 0, slug: 'follow_instagram', label: 'Follow us on Instagram', points: 10, category: 'social_follow', frequency: 'one_time', enabled: true, sort_order: 3, social_url: '', legacyFlag: 'followed_instagram' },
  { id: 0, slug: 'share_product', label: 'Share a product', points: 5, category: 'predefined', frequency: 'repeatable', enabled: true, sort_order: 4 },
  { id: 0, slug: 'review_photo', label: 'Leave a photo review', points: 12, category: 'predefined', frequency: 'repeatable', enabled: true, sort_order: 5 },
  { id: 0, slug: 'review_text', label: 'Leave a text review', points: 5, category: 'predefined', frequency: 'repeatable', enabled: true, sort_order: 6 },
  { id: 0, slug: 'birthday', label: 'Birthday bonus', points: 25, category: 'predefined', frequency: 'yearly', enabled: true, sort_order: 7 },
];

/** Legacy boolean flag map for old API responses that don't include completed_actions */
const LEGACY_FLAG_MAP: Record<string, string> = {
  signup: 'signup_rewarded',
  first_order: 'first_order_rewarded',
  follow_tiktok: 'followed_tiktok',
  follow_instagram: 'followed_instagram',
};

export default function Earn() {
  const { api, settings } = useWidgetConfig();
  const { data, loading, error, refresh } = useCustomer();
  const { t } = useI18n();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [tab, setTab] = useState<'onetime' | 'repeatable'>('onetime');
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [bdayMonth, setBdayMonth] = useState('01');
  const [bdayDay, setBdayDay] = useState('01');
  const [bdayError, setBdayError] = useState<string | null>(null);
  const birthdaySubmitting = useRef(false);
  const storeUrl = settings?.referral_base_url || '';

  const handleSetBirthday = useCallback(async () => {
    if (birthdaySubmitting.current) return;
    birthdaySubmitting.current = true;
    setBdayError(null);
    try {
      await api.setBirthday(`${bdayMonth}-${bdayDay}`);
      setShowBirthdayPicker(false);
      refresh();
    } catch (err: any) {
      setBdayError(err?.message || t('earn.error_birthday'));
    } finally {
      birthdaySubmitting.current = false;
    }
  }, [api, bdayMonth, bdayDay, refresh, t]);

  // Get actions -- dynamic from API or fallback to hardcoded
  const actions = useMemo(() => {
    if (data?.earn_actions && data.earn_actions.length > 0) {
      return data.earn_actions.filter(a => a.enabled);
    }
    // Fallback: use hardcoded list with settings for social URLs
    return FALLBACK_ACTIONS.map(a => {
      if (a.slug === 'follow_tiktok') return { ...a, social_url: settings?.social_tiktok_url || 'https://www.tiktok.com' };
      if (a.slug === 'follow_instagram') return { ...a, social_url: settings?.social_instagram_url || 'https://www.instagram.com' };
      return a;
    });
  }, [data?.earn_actions, settings]);

  // Completion check: action.completed > completed_actions[] > legacy boolean flags
  const isCompleted = useCallback((action: EarnAction): boolean => {
    if (action.completed !== undefined) return action.completed;
    if (data?.completed_actions?.includes(action.slug)) return true;
    // Legacy fallback for old API responses
    if (!data) return false;
    const flag = LEGACY_FLAG_MAP[action.slug];
    if (flag) return !!(data as unknown as Record<string, unknown>)[flag];
    return false;
  }, [data]);

  // Split into tabs
  const oneTimeActions = useMemo(
    () => actions.filter(a => a.frequency === 'one_time').sort((a, b) => a.sort_order - b.sort_order),
    [actions],
  );
  const repeatableActions = useMemo(
    () => actions.filter(a => a.frequency === 'repeatable' || a.frequency === 'yearly').sort((a, b) => a.sort_order - b.sort_order),
    [actions],
  );

  const doneCount = oneTimeActions.filter(a => isCompleted(a)).length;
  const totalOneTime = oneTimeActions.length;
  const progressPct = totalOneTime > 0 ? (doneCount / totalOneTime) * 100 : 0;

  // Unified action handler for social follow + share
  const handleAction = useCallback(async (action: EarnAction) => {
    if (action.category === 'social_follow' && action.social_url) {
      window.open(action.social_url, '_blank', 'noopener');
    } else if (action.slug === 'share_product') {
      if (!data) return;
      const brandName = String(settings?.widget_brand_name || 'Our Store');
      const shareUrl = storeUrl ? `${storeUrl}${storeUrl.includes('?') ? '&' : '?'}ref=${data.referral_code}` : '';
      try {
        if (navigator.share) {
          await navigator.share({ title: brandName, text: t('earn.share_text', { brand: brandName }), url: shareUrl });
        } else {
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(t('earn.share_text', { brand: brandName }))}`,
            '_blank',
            'noopener,width=600,height=400',
          );
        }
      } catch {
        return;
      }
    }

    setLoadingAction(action.slug);
    try {
      await api.award(action.slug);
      refresh();
    } catch {
      // silently fail, user can retry
    } finally {
      setLoadingAction(null);
    }
  }, [api, refresh, data, settings, storeUrl, t]);

  // Build the action button (or undefined) for a given earn action
  const getActionButton = useCallback((action: EarnAction): React.ReactNode | undefined => {
    // Completed one-time actions don't need a button
    if (isCompleted(action) && action.frequency === 'one_time') return undefined;

    if (action.category === 'social_follow') {
      return (
        <button
          className="pw-btn pw-btn--primary pw-btn--sm"
          onClick={() => handleAction(action)}
          disabled={loadingAction === action.slug}
          type="button"
        >
          {loadingAction === action.slug ? '...' : t('earn.btn_follow')}
        </button>
      );
    }

    if (action.slug === 'share_product') {
      return (
        <button
          className="pw-btn pw-btn--primary pw-btn--sm"
          onClick={() => handleAction(action)}
          disabled={loadingAction === action.slug}
          type="button"
        >
          {loadingAction === action.slug ? '...' : t('earn.btn_share')}
        </button>
      );
    }

    // Review actions (repeatable)
    if (action.slug === 'review_photo' || action.slug === 'review_text') {
      return (
        <button
          className="pw-btn pw-btn--primary pw-btn--sm"
          onClick={() => handleAction(action)}
          disabled={loadingAction === action.slug}
          type="button"
        >
          {loadingAction === action.slug ? '...' : t('earn.btn_claim')}
        </button>
      );
    }

    // Birthday action
    if (action.slug === 'birthday') {
      if (isCompleted(action)) return undefined;

      const hasBirthday = !!data?.birthday;
      if (!hasBirthday) {
        if (showBirthdayPicker) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select
                  value={bdayMonth}
                  onChange={(e) => setBdayMonth(e.target.value)}
                  className="pw-btn pw-btn--sm"
                  style={{ padding: '4px 6px', fontSize: 12 }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{t(`months.${i + 1}`)}</option>
                  ))}
                </select>
                <select
                  value={bdayDay}
                  onChange={(e) => setBdayDay(e.target.value)}
                  className="pw-btn pw-btn--sm"
                  style={{ padding: '4px 6px', fontSize: 12 }}
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                  ))}
                </select>
                <button
                  className="pw-btn pw-btn--primary pw-btn--sm"
                  onClick={handleSetBirthday}
                  type="button"
                >
                  {t('common.save')}
                </button>
              </div>
              {bdayError && <span style={{ color: '#ef4444', fontSize: 11 }}>{bdayError}</span>}
            </div>
          );
        }
        return (
          <button
            className="pw-btn pw-btn--primary pw-btn--sm"
            onClick={() => setShowBirthdayPicker(true)}
            type="button"
          >
            {t('earn.btn_set_birthday')}
          </button>
        );
      }

      // Has birthday — check if it's birthday month
      const [monthStr] = data.birthday!.split('-');
      const birthdayMonth = parseInt(monthStr, 10);
      const currentMonth = new Date().getMonth() + 1;
      if (birthdayMonth !== currentMonth) {
        return (
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {t('earn.available_in', { month: t(`months.${birthdayMonth}`) })}
          </span>
        );
      }

      // It's birthday month — show claim button
      return (
        <button
          className="pw-btn pw-btn--primary pw-btn--sm"
          onClick={() => handleAction(action)}
          disabled={loadingAction === action.slug}
          type="button"
        >
          {loadingAction === action.slug ? '...' : t('earn.btn_claim')}
        </button>
      );
    }

    return undefined;
  }, [isCompleted, handleAction, loadingAction, data, showBirthdayPicker, bdayMonth, bdayDay, bdayError, handleSetBirthday, t]);

  // Tag for repeatable / yearly actions
  const getTag = useCallback((action: EarnAction): string | undefined => {
    if (action.frequency === 'yearly') return t('earn.tag_yearly');
    if (action.frequency === 'repeatable') {
      if (action.slug.includes('review')) return t('earn.tag_per_review');
      if (action.slug.includes('share')) return t('earn.tag_per_share');
      return t('earn.tag_repeatable');
    }
    return undefined;
  }, [t]);

  if (loading) return <div className="pw-loading">{t('common.loading')}</div>;
  if (error) return <div className="pw-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="pw-page-content">
      {/* Page Header */}
      <div className="pw-page-header">
        <div className="pw-page-header__icon pw-page-header__icon--indigo">
          <StarIcon size={24} />
        </div>
        <div>
          <div className="pw-page-header__title">{t('earn.title')}</div>
          <div className="pw-page-header__subtitle">{t('earn.subtitle')}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pw-section pw-section--padded">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="pw-section__title" style={{ textTransform: 'none', letterSpacing: 0 }}>{t('earn.progress')}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pionts-primary, #3b82f6)' }}>{doneCount}/{totalOneTime}</span>
        </div>
        <div className="pw-progress-bar">
          <div className="pw-progress-bar__fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="pw-section pw-section--padded">
        <div className="pw-tab-toggle">
          <button
            className={`pw-tab-toggle__btn ${tab === 'onetime' ? 'pw-tab-toggle__btn--active' : ''}`}
            onClick={() => setTab('onetime')}
            type="button"
          >
            {t('earn.tab_onetime')}
            <span className="pw-tab-toggle__badge">{doneCount}/{totalOneTime}</span>
          </button>
          <button
            className={`pw-tab-toggle__btn ${tab === 'repeatable' ? 'pw-tab-toggle__btn--active' : ''}`}
            onClick={() => setTab('repeatable')}
            type="button"
          >
            {t('earn.tab_repeatable')}
          </button>
        </div>

        {tab === 'onetime' && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {oneTimeActions.map(action => (
              <EarnItem
                key={action.slug}
                done={isCompleted(action)}
                label={action.label}
                points={action.points}
                action={getActionButton(action)}
              />
            ))}
            {oneTimeActions.length === 0 && (
              <li className="pw-empty"><div className="pw-empty__desc">{t('earn.no_onetime')}</div></li>
            )}
          </ul>
        )}

        {tab === 'repeatable' && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {repeatableActions.map(action => (
              <EarnItem
                key={action.slug}
                done={false}
                label={action.label}
                points={action.points}
                tag={getTag(action)}
                action={getActionButton(action)}
              />
            ))}
            {repeatableActions.length === 0 && (
              <li className="pw-empty"><div className="pw-empty__desc">{t('earn.no_repeatable')}</div></li>
            )}
          </ul>
        )}
      </div>

      {/* Points Summary */}
      <div className="pw-metric-row">
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--orange">{data.points_balance}</div>
          <div className="pw-metric__label">{t('earn.stat_balance')}</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--green">{data.points_earned_total}</div>
          <div className="pw-metric__label">{t('earn.stat_total_earned')}</div>
        </div>
        <div className="pw-metric">
          <div className="pw-metric__value pw-metric__value--blue">{data.order_count}</div>
          <div className="pw-metric__label">{t('earn.stat_orders')}</div>
        </div>
      </div>
    </div>
  );
}
