import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWidgetConfig } from '../context/WidgetConfigContext';
import useCustomer from '../hooks/useCustomer';
import useProgress from '../hooks/useProgress';
import TierCard from '../components/TierCard';
import CopyButton from '../components/CopyButton';
import ProgressRing from '../components/ProgressRing';
import ConfettiEffect from '../components/ConfettiEffect';
import { GiftIcon, timeAgo } from '@pionts/shared';
import type { Redemption, RedemptionTier } from '@pionts/shared';

export default function Redeem() {
  const { api } = useWidgetConfig();
  const { data, loading, error, refresh } = useCustomer();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(true);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchRedemptions = useCallback(() => {
    api.getMyRedemptions()
      .then(setRedemptions)
      .catch(() => {})
      .finally(() => setRedemptionsLoading(false));
  }, [api]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  const handleRedeem = useCallback(async (tier: RedemptionTier) => {
    setLoadingTier(tier.points);
    setRedeemError(null);
    try {
      await api.redeem(tier.points);
      setShowConfetti(true);
      refresh();
      fetchRedemptions();
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : 'Redemption failed. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  }, [refresh, fetchRedemptions, api]);

  const { nextTier, progressPct, tiers } = useProgress(data);
  const unusedCodes = useMemo(() => redemptions.filter((r) => !r.used), [redemptions]);
  const usedCodes = useMemo(() => redemptions.filter((r) => r.used), [redemptions]);

  if (loading) return <div className="text-center p-10 text-[#888]">Loading...</div>;
  if (error) return <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{error}</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <ConfettiEffect active={showConfetti} />
      {/* Page Header */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl px-8 py-7 flex items-center gap-[18px] shadow-[0_2px_16px_rgba(0,0,0,0.04)] max-[600px]:px-[22px] max-[600px]:py-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white bg-primary">
          <GiftIcon size={24} />
        </div>
        <div>
          <div className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight max-[600px]:text-lg">Redeem Points</div>
          <div className="text-[13px] text-[#999] mt-0.5">Spend your points on discounts</div>
        </div>
      </div>

      {/* Balance + Progress Ring */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
        <div className="flex items-center gap-7 max-[600px]:flex-col max-[600px]:text-center max-[600px]:gap-4">
          <ProgressRing size={100} radius={42} strokeWidth={7} progressPct={progressPct} gradientId="redeem-grad" className="shrink-0">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold text-primary leading-none">{data.points_balance}</div>
              <div className="text-[10px] text-[#999] uppercase tracking-[1px] font-semibold">pts</div>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-[0.5px] mb-1">Available Balance</div>
            {nextTier ? (
              <div className="text-[13px] text-[#888] mb-2.5">
                <span className="font-bold text-primary">{nextTier.points - data.points_balance}</span> pts to unlock &euro;{nextTier.discount} off
              </div>
            ) : (
              <div className="text-[13px] text-[#888] mb-2.5">All tiers unlocked!</div>
            )}
            <div className="flex gap-3 max-[600px]:justify-center">
              {tiers.map((t) => (
                <span
                  key={t.points}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-[10px] ${data.points_balance >= t.points ? 'text-primary bg-[#fff0eb]' : 'text-[#ccc] bg-bg'}`}
                >
                  {t.points}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Error */}
      {redeemError && <div className="px-4 py-3 rounded mb-4 text-sm bg-[#fef2f2] border border-[#d93025] text-[#d93025]">{redeemError}</div>}

      {/* Tier Cards */}
      <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
        <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Choose a Reward</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 mt-3.5 max-[600px]:grid-cols-2">
          {tiers.map((tier) => (
            <TierCard
              key={tier.points}
              points={tier.points}
              discount={tier.discount}
              canRedeem={data.points_balance >= tier.points}
              loading={loadingTier === tier.points}
              onRedeem={() => handleRedeem(tier)}
            />
          ))}
        </div>
      </div>

      {/* Unused Discount Codes */}
      {!redemptionsLoading && unusedCodes.length > 0 && (
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
          <div className="flex justify-between items-center mb-3.5">
            <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Your Discount Codes</div>
            <div className="text-xs text-white bg-primary px-2.5 py-[3px] rounded-full font-semibold">{unusedCodes.length} active</div>
          </div>
          <div className="-mx-[22px] overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Code</th>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Value</th>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Created</th>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]"></th>
                </tr>
              </thead>
              <tbody>
                {unusedCodes.map((r) => (
                  <tr key={r.id} className="hover:[&_td]:bg-[#fafafa] last:[&_td]:border-b-0">
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm"><span className="font-mono text-[13px] tracking-[1px] text-[#0a8a5a]">{r.discount_code}</span></td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">&euro;{r.discount_amount} off</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">{timeAgo(r.created_at)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm"><CopyButton text={r.discount_code} label="COPY" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-[#999] mt-2.5">Copy a code and paste it at checkout.</div>
        </div>
      )}

      {/* Used Codes */}
      {!redemptionsLoading && usedCodes.length > 0 && (
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-[22px]">
          <div className="text-sm font-bold text-[#1a1a1a] uppercase tracking-[0.5px]">Used Codes</div>
          <div className="-mx-[22px] overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Code</th>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Value</th>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]">Created</th>
                  <th className="text-left px-3 py-2.5 text-[13px] text-[#888] border-b border-[#e0e0e0]"></th>
                </tr>
              </thead>
              <tbody>
                {usedCodes.map((r) => (
                  <tr key={r.id} className="[&_td]:opacity-50 last:[&_td]:border-b-0">
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm"><span className="font-mono text-[13px] tracking-[1px] text-[#bbb] line-through">{r.discount_code}</span></td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">&euro;{r.discount_amount} off</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm">{timeAgo(r.created_at)}</td>
                    <td className="px-3 py-2.5 border-b border-[#f0f0f0] text-sm"><span className="text-[11px] font-bold text-[#999] bg-[#f0f0f0] px-2 py-[3px] rounded-[3px] tracking-[1px]">USED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
