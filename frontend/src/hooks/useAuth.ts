import { useState, useEffect, useCallback } from 'react';
import { api, tokenStore } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: tokenStore.get(),
    isLoading: !!tokenStore.get(), // true if we have a saved token to validate
    error: null,
  });

  // On mount: if a token exists, verify it and load user info
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    api
      .me()
      .then((user) => setState({ user, token, isLoading: false, error: null }))
      .catch(() => {
        tokenStore.clear();
        setState({ user: null, token: null, isLoading: false, error: null });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { token } = await api.login(email, password);
      tokenStore.set(token);
      const user = await api.me();
      setState({ user, token, isLoading: false, error: null });
    } catch (err) {
      const message = (err as Error).message;
      setState((s) => ({ ...s, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setState((s) => ({ ...s, error: null }));
      try {
        // Attempt registration; some backends return a token directly
        const result = await api.register(name, email, password);
        let token = result?.token;

        // If no token was returned, sign in with the new credentials
        if (!token) {
          const loginResult = await api.login(email, password);
          token = loginResult.token;
        }

        tokenStore.set(token);
        const user = await api.me();
        setState({ user, token, isLoading: false, error: null });
      } catch (err) {
        const message = (err as Error).message;
        setState((s) => ({ ...s, error: message }));
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ user: null, token: null, isLoading: false, error: null });
  }, []);

  const STAFF_ROLES = new Set(['ADMIN', 'EMPLOYEE', 'CHEF']);

  return {
    ...state,
    isStaff: state.user ? STAFF_ROLES.has(state.user.role) : false,
    login,
    register,
    logout,
  };
}
