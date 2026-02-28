import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useClipboard from '../hooks/useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(() => Promise.resolve()) },
    });
  });

  it('starts with copied = false', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
  });

  it('sets copied to true after copying', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copyToClipboard('hello');
    });

    expect(result.current.copied).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('resets copied after 2 seconds', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copyToClipboard('hello');
    });
    expect(result.current.copied).toBe(true);

    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.copied).toBe(false);

    vi.useRealTimers();
  });

  it('falls back to execCommand when clipboard API fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) },
    });
    document.execCommand = vi.fn(() => true);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copyToClipboard('fallback text');
    });

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
  });
});
