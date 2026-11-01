import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Linking } from '../web/dom';

import {
  authService,
  type LoginPayload,
  type ParentUser,
  type RegisterParentPayload,
  type RegisterParentResult,
} from '../features/auth/services/authService';
import { env } from '../config/env';

type AuthContextValue = {
  user: ParentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  registerParent: (payload: RegisterParentPayload) => Promise<RegisterParentResult>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  recoveryUrl: string | null;
  startPasswordRecovery: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      setUser(await authService.me());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      try {
        const parent = await authService.me();
        if (active) setUser(parent);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void boot();

    const removeAuthListener = authService.onAuthStateChange(() => {
      if (active) void refreshMe();
    });

    const inspectUrl = (url: string | null) => {
      if (active && url?.startsWith(env.PASSWORD_RESET_REDIRECT_URL)) {
        setRecoveryUrl(url);
      }
    };

    void Linking.getInitialURL().then(inspectUrl);
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      inspectUrl(url);
    });

    return () => {
      active = false;
      removeAuthListener();
      linkingSubscription.remove();
    };
  }, [refreshMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    setUser(await authService.login(payload));
  }, []);

  const registerParent = useCallback(async (payload: RegisterParentPayload) => {
    const result = await authService.registerParent(payload);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await authService.requestPasswordReset(email);
  }, []);

  const startPasswordRecovery = useCallback(async () => {
    if (!recoveryUrl) throw new Error('Password reset link পাওয়া যায়নি।');
    setUser(await authService.startPasswordRecovery(recoveryUrl));
  }, [recoveryUrl]);

  const updatePassword = useCallback(async (password: string) => {
    setUser(await authService.updatePassword(password));
  }, []);

  const clearPasswordRecovery = useCallback(() => setRecoveryUrl(null), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    registerParent,
    logout,
    refreshMe,
    requestPasswordReset,
    recoveryUrl,
    startPasswordRecovery,
    updatePassword,
    clearPasswordRecovery,
  }), [
    user,
    loading,
    login,
    registerParent,
    logout,
    refreshMe,
    requestPasswordReset,
    recoveryUrl,
    startPasswordRecovery,
    updatePassword,
    clearPasswordRecovery,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
