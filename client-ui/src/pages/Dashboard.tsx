import { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useCustomer from '../hooks/useCustomer';
import useProgress from '../hooks/useProgress';
import useTier from '../hooks/useTier';
import HistoryEntry from '../components/HistoryEntry';
import CopyButton from '../components/CopyButton';
import ProgressRing from '../components/ProgressRing';
import TierBadge from '../components/TierBadge';
import AnimatedCounter from '../components/AnimatedCounter';
import { GiftIcon, StarIcon, UsersIcon, ArrowRightIcon } from '@pionts/shared';
import { useWidgetConfig } from '../context/WidgetConfigContext';

export default function Dashboard() {
  const { data, loading, error } = useCustomer();
  const { settings } = useWidgetConfig();
  const { nextTier, progressPct } = useProgress(data);
  const tier = useTier(settings as any, data?.points_earned_total || 0);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  const [shortcutsHeight, setShortcutsHeight] = useState<string | null>(null);

  useEffect(() => {
    if (!shortcutsRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setShortcutsHeight(entry.contentRect.height + 'px');
    });
    ro.observe(shortcutsRef.current);
    return () => ro.disconnect();
  }, []);

  if (loading) return <div className="text-center p-10 text-[#888]">Loading...</div>;
  if (error) return <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{error}</div>;
  if (!data) return null;

  const modules = data.enabled_modules;
  const pointsEnabled = modules?.points !== false;
  const referralsEnabled = modules?.referrals !== false;

  const history = data.history || [];
  const redeemStats = data.redemption_stats || {};
  const refStats = data.referral_stats || { direct: 0, network: 0 };
  const refEarnings = data.referral_earnings || 0;
  const storeUrl = settings?.referral_base_url || 'https://8bc.store';
  const refUrl = `${storeUrl}?ref=${data.referral_code}`;
  const memberDate = new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Dynamic earn counts: use earn_actions from API when available, fallback to legacy boolean flags
  let doneCount: number;
  let totalActions: number;
  if (data.earn_actions && data.earn_actions.length > 0) {
    const enabledActions = data.earn_actions.filter(a => a.enabled);
    totalActions = enabledActions.length;
    doneCount = enabledActions.filter(a =>
      a.completed || data.completed_actions?.includes(a.slug)
    ).length;
  } else {
    doneCount = [data.signup_rewarded, data.first_order_rewarded, data.followed_tiktok, data.followed_instagram].filter(Boolean).length;
    totalActions = 8;
  }

  // Quick links based on enabled modules
  const quickLinks = useMemo(() => {
    const links: { to: string; icon: React.ReactNode; iconBg: string; title: string; subtitle: string }[] = [];
    if (pointsEnabled) {
      links.push({
        to: '/redeem', icon: <GiftIcon size={22} />, iconBg: 'bg-primary',
        title: 'Redeem',
        subtitle: redeemStats.unused_codes
          ? `${redeemStats.unused_codes} code${redeemStats.unused_codes > 1 ? 's' : ''} ready`
          : 'Spend your points',
      });
      links.push({
        to: '/earn', icon: <StarIcon size={22} />, iconBg: 'bg-[#6366f1]',
        title: 'Earn',
        subtitle: `${doneCount}/${totalActions} completed`,
      });
    }
    if (referralsEnabled) {
      links.push({
        to: '/referrals', icon: <UsersIcon size={22} />, iconBg: 'bg-[#0ea5e9]',
        title: 'Referrals',
        subtitle: `${refStats.network ?? 0} in network`,
      });
    }
    return links;
  }, [pointsEnabled, referralsEnabled, redeemStats, doneCount, totalActions, refStats.network]);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl p-8 flex justify-between items-center shadow-[0_2px_16px_rgba(0,0,0,0.04)] max-[600px]:flex-col max-[600px]:text-center max-[600px]:gap-5 max-[600px]:p-6">
        <div className="flex flex-col gap-1 max-[600px]:items-center">
          <div className="text-[13px] text-[#999] uppercase tracking-[1.5px] font-semibold">Welcome back</div>
          <div className="flex items-center gap-2 max-[600px]:justify-center">
            <span className="text-[26px] font-extrabold text-[#1a1a1a] leading-tight max-[600px]:text-[22px]">{data.name || 'Crew Member'}</span>
            {tier.enabled && <TierBadge tier={tier.currentTier} multiplier={tier.currentMultiplier} />}
          </div>
          <div className="text-[13px] text-[#aaa] mt-1">Member since {memberDate}</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ProgressRing size={120} radius={52} strokeWidth={8} progressPct={progressPct} gradientId="ring-grad" className="max-[600px]:!w-[100px] max-[600px]:!h-[100px]">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedCounter value={data.points_balance} className="text-[28px] font-extrabold text-primary leading-none max-[600px]:text-[22px]" />
              <div className="text-[11px] text-[#999] uppercase tracking-[1px] font-semibold">pts</div>
            </div>
          </ProgressRing>
          <div className="text-xs text-[#888] text-center">
            {nextTier
              ? <>{nextTier.points - data.points_balance} to &euro;{nextTier.discount} off</>
              : <>Max tier!</>
            }
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl flex items-center overflow-hidden max-[768px]:flex-wrap max-[600px]:flex-wrap">
        <div className="flex-1 text-center py-[18px] px-3 max-[768px]:flex-[0_0_calc(33.33%-1px)] max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{data.points_earned_total}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Total Earned</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[768px]:flex-[0_0_calc(33.33%-1px)] max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#0a8a5a] leading-none max-[768px]:text-lg">&euro;{redeemStats.total_redeemed || 0}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Total Saved</div>
        </div>
        <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
        <div className="flex-1 text-center py-[18px] px-3 max-[768px]:flex-[0_0_calc(33.33%-1px)] max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
          <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{data.order_count}</div>
          <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Orders</div>
        </div>
        {referralsEnabled && (
          <>
            <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
            <div className="flex-1 text-center py-[18px] px-3 max-[768px]:flex-[0_0_calc(33.33%-1px)] max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
              <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{refStats.direct ?? 0}</div>
              <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Referrals</div>
            </div>
            <div className="w-px h-10 bg-[#e0e0e0] shrink-0 max-[600px]:hidden" />
            <div className="flex-1 text-center py-[18px] px-3 max-[768px]:flex-[0_0_calc(33.33%-1px)] max-[600px]:flex-[0_0_50%] max-[600px]:py-3.5 max-[600px]:px-2">
              <div className="text-[22px] font-bold text-[#1a1a1a] leading-none max-[768px]:text-lg">{refEarnings}</div>
              <div className="text-[11px] text-[#999] mt-1 uppercase tracking-[0.5px]">Network Pts</div>
            </div>
          </>
        )}
      </div>

      {/* Referral Link — only when referrals module enabled */}
      {referralsEnabled && (
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
          <div className="flex justify-between items-center mb-3.5">
            <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Your Referral Link</div>
            <div className="text-xs text-white bg-primary px-2.5 py-[3px] rounded-full font-semibold">{refStats.direct ?? 0} referrals</div>
          </div>
          <div className="flex gap-2 mb-2.5 max-[600px]:flex-col">
            <input
              className="flex-1 bg-bg border border-[#ddd] text-[#1a1a1a] px-3.5 py-2.5 rounded-md text-sm font-sans outline-none focus:border-primary"
              type="text"
              value={refUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <CopyButton text={refUrl} />
          </div>
          <div className="text-xs text-[#999] mt-2.5">Share this link — they get 5% off, you earn 5 pts per order.</div>
        </div>
      )}

      {/* Two columns: Activity + Quick Links */}
      {quickLinks.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 items-start dash-grid-responsive">
          {/* Recent Activity */}
          <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px] flex flex-col overflow-hidden" style={shortcutsHeight ? { maxHeight: shortcutsHeight } : undefined}>
            <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Recent Activity</div>
            {history.length === 0 ? (
              <div className="text-center p-5 text-[#999]">No activity yet.</div>
            ) : (
              <ul className="list-none p-0 flex-1 overflow-y-auto min-h-0 -mx-[22px] px-[22px] activity-list-scroll">
                {history.map((entry, i) => (
                  <HistoryEntry
                    key={entry.id || i}
                    points={entry.points}
                    description={entry.description}
                    created_at={entry.created_at}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3" ref={shortcutsRef}>
            {quickLinks.map(link => (
              <Link key={link.to} to={link.to} className="bg-white border border-[#e0e0e0] rounded-xl p-5 flex items-center gap-3.5 no-underline text-inherit transition-all duration-200 hover:border-[#ccc] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-px hover:no-underline max-[600px]:p-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white ${link.iconBg}`}>
                  {link.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[#1a1a1a]">{link.title}</div>
                  <div className="text-xs text-[#999] mt-0.5">{link.subtitle}</div>
                </div>
                <ArrowRightIcon className="text-[#ccc] shrink-0" size={18} />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* If no quick links (all modules disabled), show activity full width */
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px] flex flex-col overflow-hidden">
          <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Recent Activity</div>
          {history.length === 0 ? (
            <div className="text-center p-5 text-[#999]">No activity yet.</div>
          ) : (
            <ul className="list-none p-0 flex-1 overflow-y-auto min-h-0 -mx-[22px] px-[22px] activity-list-scroll">
              {history.map((entry, i) => (
                <HistoryEntry
                  key={entry.id || i}
                  points={entry.points}
                  description={entry.description}
                  created_at={entry.created_at}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
