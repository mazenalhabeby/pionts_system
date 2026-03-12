import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseFetchResult } from '../types/api.types';

export default function useFetch<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async (showLoading = true) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(controller.signal);
      if (!controller.signal.aborted) setData(result);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load(true);
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(() => {
    load(false);
  }, [load]);

  return { data, loading, error, refresh };
}
