/**
 * Centralized logout handler to prevent duplicate toasts and navigation issues
 * when session expires. This ensures only ONE logout process happens even if
 * multiple 401 responses occur simultaneously.
 */

let isLoggingOut = false;
let logoutTimeout: NodeJS.Timeout | null = null;

export const isLogoutInProgress = (): boolean => {
  return isLoggingOut;
};

export const handleSessionExpiry = () => {
  // Prevent multiple simultaneous logout handlers
  if (isLoggingOut) {
    return;
  }
  
  // Check if already on login page - no need to redirect
  const currentPath = window.location.pathname;
  if (currentPath === '/login' || currentPath === '/setup') {
    isLoggingOut = false;
    return;
  }
  
  isLoggingOut = true;
  
  // Clear all auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Dispatch single toast notification
  try {
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { message: 'Your session expired. Please log in again.', type: 'warning' },
      })
    );
  } catch (e) {
    console.error('Failed to dispatch toast:', e);
  }
  
  // Notify about auth state change
  try {
    window.dispatchEvent(
      new CustomEvent('app:auth-changed', { 
        detail: { isAuthenticated: false } 
      })
    );
  } catch (e) {
    console.error('Failed to dispatch auth change:', e);
  }
  
  // Clear any pending timeout
  if (logoutTimeout) {
    clearTimeout(logoutTimeout);
  }
  
  // Redirect using replace to avoid navigation history issues
  logoutTimeout = setTimeout(() => {
    window.location.replace('/login');
    // Reset flag after navigation (in case it doesn't complete)
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }, 150);
};

export const resetLogoutState = () => {
  isLoggingOut = false;
  if (logoutTimeout) {
    clearTimeout(logoutTimeout);
    logoutTimeout = null;
  }
};
