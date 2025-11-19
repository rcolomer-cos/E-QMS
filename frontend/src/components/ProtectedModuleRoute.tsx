import { Navigate } from 'react-router-dom';
import { useModuleVisibility } from '../contexts/ModuleVisibilityContext';
import { getCurrentUser } from '../services/authService';

interface ProtectedModuleRouteProps {
  moduleKey: string;
  children: React.ReactElement;
}

/**
 * Component that protects routes based on module visibility
 * Admins and superusers can always access regardless of module visibility
 */
const ProtectedModuleRoute: React.FC<ProtectedModuleRouteProps> = ({ moduleKey, children }) => {
  const { isModuleEnabled } = useModuleVisibility();
  
  // Check if user is admin/superuser
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
    
    // Admins always have access
    if (hasRole('admin') || hasRole('superuser')) {
      return children;
    }
  }
  
  // For non-admin users, check module visibility
  if (!isModuleEnabled(moduleKey)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedModuleRoute;
