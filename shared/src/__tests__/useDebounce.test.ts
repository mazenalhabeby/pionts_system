import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from '../hooks/useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces value changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('ab');

    vi.useRealTimers();
  });

  it('resets timer on rapid changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a');

    rerender({ value: 'abc' });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('abc');

    vi.useRealTimers();
  });

  it('uses default delay of 400ms', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'x' } },
    );

    rerender({ value: 'y' });
    act(() => { vi.advanceTimersByTime(399); });
    expect(result.current).toBe('x');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('y');

    vi.useRealTimers();
  });
});
