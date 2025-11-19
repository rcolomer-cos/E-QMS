import { useState, useEffect } from 'react';
import api from './api';
import { LoginCredentials, AuthResponse, User } from '../types';
import { handleSessionExpiry, isLogoutInProgress, resetLogoutState } from './logoutHandler';

interface LoginOptions extends LoginCredentials {
  rememberMe?: boolean;
}

export const login = async (credentials: LoginOptions): Promise<AuthResponse> => {
  // Reset logout state when logging in
  resetLogoutState();
  
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  const { token, user } = response.data;

  const storage = credentials.rememberMe ? localStorage : sessionStorage;
  
  // Clear both storages first to avoid conflicts
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Store in appropriate storage
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  
  // Store rememberMe preference
  if (credentials.rememberMe) {
    localStorage.setItem('rememberMe', 'true');
  } else {
    localStorage.removeItem('rememberMe');
  }

  // Notify app about auth state change (same-tab updates)
  try {
    window.dispatchEvent(new CustomEvent('app:auth-changed', { detail: { isAuthenticated: true } }));
  } catch {}

  return response.data;
};

export const logout = () => {
  if (!isLogoutInProgress()) {
    handleSessionExpiry();
  }
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getRememberMe = (): boolean => {
  return localStorage.getItem('rememberMe') === 'true';
};

export const useAuth = () => {
  const initialToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  const initialUser = getCurrentUser();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(initialToken && initialUser));
  const [user, setUser] = useState<User | null>(initialUser);

  // Optional: re-check on mount in case storage changed between renders
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = getCurrentUser();
    const authed = Boolean(token && storedUser);
    setIsAuthenticated(authed);
    setUser(storedUser);
  }, []);

  // Listen for same-tab auth changes (triggered by login/logout)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ isAuthenticated: boolean }>;
      const currentPath = window.location.pathname;
      
      // Only prevent updates during logout (when isAuthenticated becomes false)
      // Allow updates during login (when isAuthenticated becomes true)
      if ((currentPath === '/login' || currentPath === '/setup') && ce.detail?.isAuthenticated === false) {
        return;
      }
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = getCurrentUser();
      const authed = Boolean(token && storedUser);
      setIsAuthenticated(authed);
      setUser(storedUser);
    };
    window.addEventListener('app:auth-changed', handler as EventListener);
    return () => window.removeEventListener('app:auth-changed', handler as EventListener);
  }, []);

  // Validate token with backend once on mount; auto-logout if invalid/expired
  useEffect(() => {
    // Don't validate if on login/setup pages to prevent jumping
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/setup') {
      return;
    }
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    api
      .get<User>('/auth/profile')
      .then(({ data }) => {
        setIsAuthenticated(true);
        setUser(data);
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        try {
          storage.setItem('user', JSON.stringify(data));
        } catch {}
      })
      .catch((err) => {
        // Let api.ts interceptor handle 401 errors - don't duplicate the logic
        // The interceptor will call handleSessionExpiry() which handles everything
      });
  }, []);

  return {
    isAuthenticated,
    user,
    login,
    logout,
  };
};
