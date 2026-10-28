import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, Me, setToken } from './api';

type Ctx = {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
};

const AuthCtx = createContext<Ctx>({ me: null, loading: true, refresh: async () => {}, signIn: async () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      setMe(await api<Me>('/me'));
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = async (token: string) => {
    setToken(token);
    setLoading(true);
    await refresh();
  };

  const signOut = () => {
    setToken(null);
    setMe(null);
  };

  return <AuthCtx.Provider value={{ me, loading, refresh, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
