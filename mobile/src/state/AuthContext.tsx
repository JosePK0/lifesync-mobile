import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authRepository } from '../data/authRepository';
import { secureStorage } from '../data/secureStorage';
import { setUnauthorizedHandler, isNetworkError } from '../data/api';
import { isTokenExpired } from '../domain/parsing';
import { User } from '../domain/types';
import { unregisterDevicePushToken } from '../core/notifications/pushService';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await unregisterDevicePushToken();
    await authRepository.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      authRepository.logout().finally(() => setUser(null));
    });
    (async () => {
      try {
        const token = await secureStorage.getToken();
        if (!token || isTokenExpired(token)) {
          await authRepository.logout();
        } else {
          try {
            setUser(await authRepository.me());
          } catch (e) {
            if (isNetworkError(e)) {
              // offline: reutiliza la sesión guardada decodificando el uid del token
              const uid = Number(JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub);
              const saved = await secureStorage.getJson<User>('lifesync.user');
              setUser(saved && saved.id === uid ? saved : null);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const u = await authRepository.login(email, password);
        await secureStorage.setJson('lifesync.user', u);
        setUser(u);
      },
      signUp: async (name, email, password) => {
        const u = await authRepository.register(name, email, password);
        await secureStorage.setJson('lifesync.user', u);
        setUser(u);
      },
      signOut,
    }),
    [user, loading, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
