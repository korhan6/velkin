'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, refresh, setToken } from './api';

export type Me = { id: string; email: string; name: string | null; role: 'ADMIN' | 'EDITOR'; totpEnabled: boolean; mustEnroll2fa: boolean };

type Ctx = {
  me: Me | null;
  loading: boolean;
  reload: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ mfaToken?: string }>;
  verify: (mfaToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setMe(await api<Me>('/v1/auth/me'));
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (await refresh()) await reload();
      setLoading(false);
    })();
  }, [reload]);

  const login = async (email: string, password: string) => {
    const r = await api<{ mfaRequired: boolean; mfaToken?: string; accessToken?: string }>('/v1/auth/login', {
      method: 'POST',
      json: { email, password },
    });
    if (r.mfaRequired) return { mfaToken: r.mfaToken };
    setToken(r.accessToken ?? null);
    await reload();
    return {};
  };

  const verify = async (mfaToken: string, code: string) => {
    const r = await api<{ accessToken: string }>('/v1/auth/2fa/verify', { method: 'POST', json: { mfaToken, code } });
    setToken(r.accessToken);
    await reload();
  };

  const logout = async () => {
    await api('/v1/auth/logout', { method: 'POST' }).catch(() => undefined);
    setToken(null);
    setMe(null);
  };

  return <AuthCtx.Provider value={{ me, loading, reload, login, verify, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
