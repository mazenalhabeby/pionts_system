import { useMemo } from 'react';
import type { CustomerData, RedemptionTier } from '@pionts/shared';

interface UseProgressResult {
  nextTier: RedemptionTier | null;
  progressPct: number;
  tiers: RedemptionTier[];
}

export default function useProgress(data: CustomerData | null): UseProgressResult {
  return useMemo(() => {
    if (!data?.redemption_tiers) return { nextTier: null, progressPct: 0, tiers: [] };
    const sorted = [...data.redemption_tiers].sort((a, b) => a.points - b.points);
    const next = sorted.find((t) => t.points > data.points_balance) || null;
    let pct = 100;
    if (next) {
      const prev = [...sorted].reverse().find((t) => t.points <= data.points_balance);
      const floor = prev ? prev.points : 0;
      const range = next.points - floor;
      pct = range > 0 ? Math.min(((data.points_balance - floor) / range) * 100, 100) : 100;
    }
    return { nextTier: next, progressPct: pct, tiers: sorted };
  }, [data]);
}
