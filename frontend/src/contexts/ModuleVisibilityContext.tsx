import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getEnabledModules, ModuleVisibility } from '../services/moduleVisibilityService';
import { getCurrentUser } from '../services/authService';

interface ModuleVisibilityContextType {
  modules: ModuleVisibility[];
  loading: boolean;
  error: string | null;
  isModuleEnabled: (moduleKey: string) => boolean;
  refreshModules: () => Promise<void>;
}

const ModuleVisibilityContext = createContext<ModuleVisibilityContextType | undefined>(undefined);

export const ModuleVisibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<ModuleVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEnabledModules();
      setModules(data);
    } catch (err) {
      console.error('Failed to load module visibility:', err);
      setError('Failed to load module visibility settings');
      // On error, assume all modules are enabled
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const isModuleEnabled = (moduleKey: string): boolean => {
    // If still loading or error occurred, default to showing module
    if (loading || error) {
      return true;
    }

    // Check if user is admin - admins always see all modules
    const user = getCurrentUser();
    if (user) {
      const roleNames = (user.roles?.map(r => r.name) || [user.role]).filter(Boolean) as string[];
      const normalizeRole = (name: string) => {
        const n = (name || '').toLowerCase();
        if (n === 'administrator' || n.startsWith('admin')) return 'admin';
        if (n === 'super user' || n === 'super-user' || n.startsWith('super')) return 'superuser';
        return n;
      };
      const hasRole = (r: string) => roleNames.map(normalizeRole).includes(r.toLowerCase());
      
      if (hasRole('admin') || hasRole('superuser')) {
        return true; // Admins always see all modules
      }
    }

    // For non-admin users, check the module's enabled status
    const module = modules.find(m => m.moduleKey === moduleKey);
    return module ? module.isEnabled : true; // Default to enabled if module not found
  };

  const refreshModules = async () => {
    await loadModules();
  };

  return (
    <ModuleVisibilityContext.Provider
      value={{
        modules,
        loading,
        error,
        isModuleEnabled,
        refreshModules,
      }}
    >
      {children}
    </ModuleVisibilityContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModuleVisibility = (): ModuleVisibilityContextType => {
  const context = useContext(ModuleVisibilityContext);
  if (!context) {
    throw new Error('useModuleVisibility must be used within a ModuleVisibilityProvider');
  }
  return context;
};
