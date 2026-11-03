import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const ctrl = useRef<AbortController | null>(null);

  const fetchPath = useCallback(async (p: string, signal: AbortSignal) => {
    try {
      setData(await api<T>(p, { signal }));
      setError(null);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e.message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    if (!path) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    await fetchPath(path, c.signal);
  }, [path, fetchPath]);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    fetchPath(path, c.signal);
    return () => c.abort();
  }, [path, fetchPath]);

  useEffect(() => () => ctrl.current?.abort(), []);

  return { data, error, loading, reload, setData };
}
