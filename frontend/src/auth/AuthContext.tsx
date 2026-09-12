import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setToken, clearToken, hasToken } from '../api/client';
import { Me } from '../api/types';

interface AuthContextValue {
  me: Me | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: Me, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // We track whether a token exists in plain React state (set at login/logout
  // time), rather than reaching for useEffect to "notice" localStorage changes.
  const [tokenPresent, setTokenPresent] = useState<boolean>(hasToken());

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/users/me'),
    enabled: tokenPresent,
    retry: false,
  });

  function login(_user: Me, token: string) {
    setToken(token);
    setTokenPresent(true);
    queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  function logout() {
    clearToken();
    setTokenPresent(false);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ me, isLoading: tokenPresent && isLoading, isAuthenticated: !!me, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
