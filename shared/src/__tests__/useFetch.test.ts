import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useFetch from '../hooks/useFetch';

describe('useFetch', () => {
  it('starts in loading state', () => {
    const fetchFn = vi.fn(() => new Promise<string>(() => {}));
    const { result } = renderHook(() => useFetch(fetchFn, [fetchFn]));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets data on success', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ name: 'test' }));
    const { result } = renderHook(() => useFetch(fetchFn, [fetchFn]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ name: 'test' });
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const fetchFn = vi.fn(() => Promise.reject(new Error('Network error')));
    const { result } = renderHook(() => useFetch(fetchFn, [fetchFn]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('sets generic error for non-Error throws', async () => {
    const fetchFn = vi.fn(() => Promise.reject('string error'));
    const { result } = renderHook(() => useFetch(fetchFn, [fetchFn]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('An error occurred');
  });

  it('provides a refresh function', async () => {
    let callCount = 0;
    const fetchFn = vi.fn(() => Promise.resolve({ count: ++callCount }));
    const { result } = renderHook(() => useFetch(fetchFn, [fetchFn]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ count: 1 });

    await result.current.refresh();
    await waitFor(() => expect(result.current.data).toEqual({ count: 2 }));
  });
});
