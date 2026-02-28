import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseFetchResult } from '../types/api.types';

export default function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = [],
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) setData(result);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load(true);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const refresh = useCallback(() => {
    load(false);
  }, [load]);

  return { data, loading, error, refresh };
}
