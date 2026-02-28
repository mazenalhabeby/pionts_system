import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useProgress from '../hooks/useProgress';
import type { CustomerData } from '@pionts/shared';

describe('useProgress', () => {
  it('returns defaults with null data', () => {
    const { result } = renderHook(() => useProgress(null));
    expect(result.current).toEqual({ nextTier: null, progressPct: 0, tiers: [] });
  });

  it('returns defaults when data has no redemption_tiers', () => {
    const { result } = renderHook(() => useProgress({ points_balance: 50 } as CustomerData));
    expect(result.current).toEqual({ nextTier: null, progressPct: 0, tiers: [] });
  });

  it('calculates next tier correctly (first tier above balance)', () => {
    const data = {
      points_balance: 30,
      redemption_tiers: [
        { points: 100, discount: 5 },
        { points: 50, discount: 2 },
        { points: 200, discount: 10 },
      ],
    } as CustomerData;
    const { result } = renderHook(() => useProgress(data));
    expect(result.current.nextTier).toEqual({ points: 50, discount: 2 });
  });

  it('returns progressPct=100 when past all tiers', () => {
    const data = {
      points_balance: 500,
      redemption_tiers: [
        { points: 50, discount: 2 },
        { points: 100, discount: 5 },
        { points: 200, discount: 10 },
      ],
    } as CustomerData;
    const { result } = renderHook(() => useProgress(data));
    expect(result.current.nextTier).toBeNull();
    expect(result.current.progressPct).toBe(100);
  });

  it('calculates partial progress between tiers', () => {
    const data = {
      points_balance: 75,
      redemption_tiers: [
        { points: 50, discount: 2 },
        { points: 100, discount: 5 },
        { points: 200, discount: 10 },
      ],
    } as CustomerData;
    const { result } = renderHook(() => useProgress(data));
    // balance=75, prev tier=50, next tier=100, range=50, progress=(75-50)/50=50%
    expect(result.current.nextTier).toEqual({ points: 100, discount: 5 });
    expect(result.current.progressPct).toBe(50);
  });

  it('sorts tiers by points ascending', () => {
    const data = {
      points_balance: 0,
      redemption_tiers: [
        { points: 200, discount: 10 },
        { points: 50, discount: 2 },
        { points: 100, discount: 5 },
      ],
    } as CustomerData;
    const { result } = renderHook(() => useProgress(data));
    expect(result.current.tiers).toEqual([
      { points: 50, discount: 2 },
      { points: 100, discount: 5 },
      { points: 200, discount: 10 },
    ]);
  });
});
