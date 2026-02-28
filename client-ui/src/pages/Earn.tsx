import React, { useState, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';
import EarnItem from '../components/EarnItem';
import { StarIcon } from '@pionts/shared';
import type { EarnAction } from '@pionts/shared';

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
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [tab, setTab] = useState<'onetime' | 'repeatable'>('onetime');
  const storeUrl = settings?.referral_base_url || 'https://8bc.store';

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

  // Unified action handler for social follow + share
  const handleAction = useCallback(async (action: EarnAction) => {
    if (action.category === 'social_follow' && action.social_url) {
      window.open(action.social_url, '_blank', 'noopener');
    } else if (action.slug === 'share_product') {
      if (!data) return;
      const brandName = settings?.widget_brand_name || '8BC Store';
      const shareUrl = `${storeUrl}?ref=${data.referral_code}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: brandName, text: `Check out ${brandName}!`, url: shareUrl });
        } else {
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${brandName}!`)}`,
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
  }, [api, refresh, data, settings, storeUrl]);

  // Build the action button (or undefined) for a given earn action
  const getActionButton = useCallback((action: EarnAction): React.ReactNode | undefined => {
    // Completed one-time actions don't need a button
    if (isCompleted(action) && action.frequency === 'one_time') return undefined;

    if (action.category === 'social_follow') {
      return (
        <button
          className="bg-primary text-white border-none px-3 py-[5px] rounded cursor-pointer text-xs font-semibold font-sans transition-colors duration-200 whitespace-nowrap hover:enabled:bg-[#e03500] disabled:bg-[#ddd] disabled:text-[#999] disabled:cursor-not-allowed"
          onClick={() => handleAction(action)}
          disabled={loadingAction === action.slug}
          type="button"
        >
          {loadingAction === action.slug ? '...' : 'FOLLOW'}
        </button>
      );
    }

    if (action.slug === 'share_product') {
      return (
        <button
          className="bg-primary text-white border-none px-3 py-[5px] rounded cursor-pointer text-xs font-semibold font-sans transition-colors duration-200 whitespace-nowrap hover:enabled:bg-[#e03500] disabled:bg-[#ddd] disabled:text-[#999] disabled:cursor-not-allowed"
          onClick={() => handleAction(action)}
          disabled={loadingAction === action.slug}
          type="button"
        >
          {loadingAction === action.slug ? '...' : 'SHARE'}
        </button>
      );
    }

    return undefined;
  }, [isCompleted, handleAction, loadingAction]);

  // Tag for repeatable / yearly actions
  const getTag = useCallback((action: EarnAction): string | undefined => {
    if (action.frequency === 'yearly') return 'yearly';
    if (action.frequency === 'repeatable') {
      if (action.slug.includes('review')) return 'per review';
      if (action.slug.includes('share')) return 'per share';
      return 'repeatable';
    }
    return undefined;
  }, []);

  if (loading) return <div className="text-center p-10 text-[#888]">Loading...</div>;
  if (error) return <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{error}</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl px-8 py-7 flex items-center gap-[18px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] max-[600px]:px-[22px] max-[600px]:py-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white bg-[#6366f1]">
          <StarIcon size={24} />
        </div>
        <div>
          <div className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight max-[600px]:text-lg">Earn Points</div>
          <div className="text-[13px] text-[#999] mt-0.5">Complete actions to earn rewards</div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
        <div className="flex border-b border-[#e0e0e0] -mx-[22px] -mt-[22px] mb-4 px-[22px]">
          <button
            className={`bg-transparent border-none px-5 py-3.5 text-sm font-semibold cursor-pointer relative flex items-center gap-2 font-sans transition-colors duration-200 hover:text-[#555] ${tab === 'onetime' ? 'text-[#1a1a1a] tab-active-indicator' : 'text-[#999]'}`}
            onClick={() => setTab('onetime')}
            type="button"
          >
            One-Time
            <span className={`text-[11px] font-semibold text-white px-[7px] py-[1px] rounded-[10px] ${tab === 'onetime' ? 'bg-primary' : 'bg-[#ccc]'}`}>{doneCount}/{totalOneTime}</span>
          </button>
          <button
            className={`bg-transparent border-none px-5 py-3.5 text-sm font-semibold cursor-pointer relative flex items-center gap-2 font-sans transition-colors duration-200 hover:text-[#555] ${tab === 'repeatable' ? 'text-[#1a1a1a] tab-active-indicator' : 'text-[#999]'}`}
            onClick={() => setTab('repeatable')}
            type="button"
          >
            Repeatable
            <span className={`text-[11px] font-semibold text-white px-[7px] py-[1px] rounded-[10px] ${tab === 'repeatable' ? 'bg-primary' : 'bg-[#ccc]'}`}>Unlimited</span>
          </button>
        </div>

        {tab === 'onetime' && (
          <ul className="list-none p-0">
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
              <li className="text-center py-5 text-[#999] text-sm">No one-time actions available.</li>
            )}
          </ul>
        )}

        {tab === 'repeatable' && (
          <ul className="list-none p-0">
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
              <li className="text-center py-5 text-[#999] text-sm">No repeatable actions available.</li>
            )}
          </ul>
        )}
      </div>

      {/* Points Summary */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl flex items-center overflow-hidden max-[768px]:flex-wrap max-[600px]:flex-wrap">
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{data.points_balance}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Balance</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{data.points_earned_total}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Total Earned</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{data.order_count}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Orders</div>
        </div>
      </div>
    </div>
  );
}
