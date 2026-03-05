'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi, User } from '../api';
import { getStoredUser, setToken, setStoredUser, clearAuth } from '../auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setState({ user: stored, isAuthenticated: true, isLoading: false });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data.data;
    setToken(token);
    setStoredUser(user);
    setState({ user, isAuthenticated: true, isLoading: false });
    return user;
  }, []);

  const signup = useCallback(async (email: string, username: string, password: string) => {
    const res = await authApi.signup(email, username, password);
    const { token, user } = res.data.data;
    setToken(token);
    setStoredUser(user);
    setState({ user, isAuthenticated: true, isLoading: false });
    return user;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/';
  }, []);

  return { ...state, login, signup, logout };
}
