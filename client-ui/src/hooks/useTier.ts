import { useMemo } from 'react';

interface TierConfig {
  gamification_enabled?: string;
  gamification_tiers?: string;
}

export interface TierInfo {
  enabled: boolean;
  currentTier: string;
  currentMultiplier: number;
  nextTier: string | null;
  pointsToNext: number;
  tiers: { label: string; threshold: number; multiplier: number }[];
}

function parseTiers(raw?: string): { label: string; threshold: number; multiplier: number }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((t: any) => ({ label: String(t.label || ''), threshold: Number(t.threshold) || 0, multiplier: Number(t.multiplier) || 1 }))
        .sort((a: any, b: any) => a.threshold - b.threshold);
    }
  } catch { /* fall through */ }
  return [];
}

export default function useTier(settings: TierConfig | undefined, pointsEarnedTotal: number): TierInfo {
  return useMemo(() => {
    if (!settings || settings.gamification_enabled !== 'true') {
      return { enabled: false, currentTier: '', currentMultiplier: 1, nextTier: null, pointsToNext: 0, tiers: [] };
    }

    const tiers = parseTiers(settings.gamification_tiers);
    if (tiers.length === 0) {
      return { enabled: false, currentTier: '', currentMultiplier: 1, nextTier: null, pointsToNext: 0, tiers: [] };
    }

    let currentTier = tiers[0].label;
    let currentMultiplier = tiers[0].multiplier;
    let nextTier: string | null = tiers[1]?.label || null;
    let pointsToNext = tiers[1] ? tiers[1].threshold - pointsEarnedTotal : 0;

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (pointsEarnedTotal >= tiers[i].threshold) {
        currentTier = tiers[i].label;
        currentMultiplier = tiers[i].multiplier;
        nextTier = tiers[i + 1]?.label || null;
        pointsToNext = tiers[i + 1] ? tiers[i + 1].threshold - pointsEarnedTotal : 0;
        break;
      }
    }

    return { enabled: true, currentTier, currentMultiplier, nextTier, pointsToNext: Math.max(0, pointsToNext), tiers };
  }, [settings, pointsEarnedTotal]);
}
