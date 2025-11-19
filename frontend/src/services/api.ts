import axios from 'axios';
import { handleSessionExpiry, isLogoutInProgress } from './logoutHandler';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const reqUrl: string | undefined = error.config?.url;
      // Do not force-redirect on any auth route or public system checks
      const isAuthRoute = !!reqUrl && reqUrl.includes('/auth/');
      const isPublicSystem = !!reqUrl && (reqUrl.includes('/system/init-status') || reqUrl.includes('/system/status'));
      const currentPath = window.location.pathname;
      const onPublicPage = currentPath === '/login' || currentPath === '/setup';
      
      if (isAuthRoute || isPublicSystem || onPublicPage) {
        return Promise.reject(error);
      }
      
      // Use centralized logout handler to prevent duplicates
      if (!isLogoutInProgress()) {
        handleSessionExpiry();
      }
    }

    // Generic error toast for other statuses when not handled elsewhere
    const status = error.response?.status as number | undefined;
    const url = error.config?.url as string | undefined;
    // Avoid spamming for GETs to status/init endpoints
    const isPublic = url?.includes('/system/init-status') || url?.includes('/system/status');
    if (!isPublic && status && status !== 401) {
      const raw = error.response?.data;
      const serverMessage = (typeof raw === 'string' && raw) || raw?.error || raw?.message;
      const message =
        (status === 429 && (serverMessage || 'Too many requests. Please slow down.')) ||
        serverMessage ||
        `Request failed${status ? ` (HTTP ${status})` : ''}.`;
      const type = status && status >= 500 ? 'error' : 'warning';
      try {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;
