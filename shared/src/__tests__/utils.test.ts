import { describe, it, expect, vi } from 'vitest';
import { timeAgo, formatPoints, formatDate, countDescendants } from '../utils';
import type { ReferralNode } from '../types';

describe('timeAgo', () => {
  it('returns empty string for null/undefined', () => {
    expect(timeAgo(null)).toBe('');
    expect(timeAgo(undefined)).toBe('');
  });

  it('returns "just now" for recent dates', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe('5 mins ago');
  });

  it('returns singular minute', () => {
    const d = new Date(Date.now() - 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe('1 min ago');
  });

  it('returns hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe('3 hours ago');
  });

  it('returns days ago', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe('2 days ago');
  });

  it('returns weeks ago', () => {
    const d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe('2 weeks ago');
  });
});

describe('formatPoints', () => {
  it('returns "+N" for positive numbers', () => {
    expect(formatPoints(10)).toBe('+10');
    expect(formatPoints(1)).toBe('+1');
  });

  it('returns "-N" for negative numbers', () => {
    expect(formatPoints(-5)).toBe('-5');
  });

  it('returns "0" for zero', () => {
    expect(formatPoints(0)).toBe('0');
  });

  it('returns "0" for null/undefined', () => {
    expect(formatPoints(null)).toBe('0');
    expect(formatPoints(undefined)).toBe('0');
  });
});

describe('formatDate', () => {
  it('returns "--" for null/undefined', () => {
    expect(formatDate(null)).toBe('--');
    expect(formatDate(undefined)).toBe('--');
  });

  it('formats a date string', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toMatch(/15 Jan 2024/);
  });
});

describe('countDescendants', () => {
  it('returns 0 for leaf node', () => {
    const node: ReferralNode = { id: '1', name: 'A', email: 'a@test.com', referral_code: 'ABC', children: [] };
    expect(countDescendants(node)).toBe(0);
  });

  it('counts direct children', () => {
    const node: ReferralNode = {
      id: '1', name: 'A', email: 'a@test.com', referral_code: 'ABC',
      children: [
        { id: '2', name: 'B', email: 'b@test.com', referral_code: 'DEF', children: [] },
        { id: '3', name: 'C', email: 'c@test.com', referral_code: 'GHI', children: [] },
      ],
    };
    expect(countDescendants(node)).toBe(2);
  });

  it('counts nested descendants recursively', () => {
    const node: ReferralNode = {
      id: '1', name: 'A', email: 'a@test.com', referral_code: 'ABC',
      children: [
        {
          id: '2', name: 'B', email: 'b@test.com', referral_code: 'DEF',
          children: [
            { id: '4', name: 'D', email: 'd@test.com', referral_code: 'JKL', children: [] },
          ],
        },
        { id: '3', name: 'C', email: 'c@test.com', referral_code: 'GHI', children: [] },
      ],
    };
    expect(countDescendants(node)).toBe(3);
  });
});
