import { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

// Caché en memoria al estilo de las redes sociales: al volver a una pantalla se muestra
// al instante lo último que se vio y se actualiza en segundo plano.
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export function prefetch(path: string) {
  if (cache.has(path) || inflight.has(path)) return;
  const p = api(path).then((d) => { cache.set(path, d); return d; }).catch(() => undefined).finally(() => inflight.delete(path));
  inflight.set(path, p);
}

export function clearApiCache() { cache.clear(); }

export function useApi<T>(path: string | null) {
  const [data, setDataState] = useState<T | null>(() => (path && cache.has(path) ? (cache.get(path) as T) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path && !cache.has(path));
  const ctrl = useRef<AbortController | null>(null);

  const setData = useCallback((v: SetStateAction<T | null>) => {
    setDataState((prev) => {
      const next = typeof v === 'function' ? (v as (p: T | null) => T | null)(prev) : v;
      if (path && next !== null) cache.set(path, next);
      return next;
    });
  }, [path]);

  const fetchPath = useCallback(async (p: string, signal: AbortSignal) => {
    try {
      const d = await api<T>(p, { signal });
      cache.set(p, d);
      if (!signal.aborted) { setDataState(d); setError(null); }
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
    await fetchPath(path, c.signal);
  }, [path, fetchPath]);

  useEffect(() => {
    if (!path) { setLoading(false); return; }
    const cached = cache.has(path);
    setDataState(cached ? (cache.get(path) as T) : null);
    setLoading(!cached);
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    fetchPath(path, c.signal);
    return () => c.abort();
  }, [path, fetchPath]);

  useEffect(() => () => ctrl.current?.abort(), []);

  return { data, error, loading, reload, setData };
}
