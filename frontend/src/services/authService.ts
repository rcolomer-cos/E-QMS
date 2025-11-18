import { useState, useEffect } from 'react';
import api from './api';
import { LoginCredentials, AuthResponse, User } from '../types';

interface LoginOptions extends LoginCredentials {
  rememberMe?: boolean;
}

export const login = async (credentials: LoginOptions): Promise<AuthResponse> => {
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

  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
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

  // Validate token with backend once on mount; auto-logout if invalid/expired
  useEffect(() => {
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
        if (err?.response?.status === 401) {
          try {
            window.dispatchEvent(
              new CustomEvent('app:toast', {
                detail: { message: 'Your session expired. Please log in again.', type: 'warning' },
              })
            );
          } catch {}
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
        }
      });
  }, []);

  return {
    isAuthenticated,
    user,
    login,
    logout,
  };
};
