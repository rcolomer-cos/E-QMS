import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout, getCurrentUser } from '../services/authService';
import { useBranding } from '../contexts/BrandingContext';
import { useModuleVisibility } from '../contexts/ModuleVisibilityContext';
import { menuStructure, MenuItem } from '../config/menuStructure';
import Footer from './Footer';
import '../styles/Layout.css';

function Layout() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const { isModuleEnabled } = useModuleVisibility();
  const roleNames: string[] = ((user?.roles?.map(r => r.name)) || (user?.role ? [user.role as string] : [])) as string[];
  const normalizeRole = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n === 'administrator' || n.startsWith('admin')) return 'admin';
    if (n === 'super user' || n === 'super-user' || n.startsWith('super')) return 'superuser';
    if (n.startsWith('manager')) return 'manager';
    if (n.startsWith('auditor')) return 'auditor';
    return n;
  };
  const roleNamesLower = roleNames.map(normalizeRole);
  const hasRole = (r: string) => roleNamesLower.includes(r.toLowerCase());

  const rolePriority = ['superuser', 'admin', 'manager', 'auditor', 'user', 'viewer'];
  const highestRoleLower = rolePriority.find(r => hasRole(r)) || '';
  const highestRoleTitle = highestRoleLower
    ? highestRoleLower.charAt(0).toUpperCase() + highestRoleLower.slice(1)
    : '';
  const { branding } = useBranding();

  const handleLogout = () => {
    logout();
    // Don't manually navigate - logout() handles the redirect
  };

  // Check if a menu item should be visible
  const isMenuItemVisible = (item: MenuItem): boolean => {
    // Check module requirement
    if (item.requiredModule && !isModuleEnabled(item.requiredModule)) {
      return false;
    }

    // Check required role (must have ALL specified roles)
    if (item.requiredRole && item.requiredRole.length > 0) {
      const hasAllRoles = item.requiredRole.every(role => hasRole(role));
      if (!hasAllRoles) return false;
    }

    // Check requireAnyRole (must have AT LEAST ONE specified role)
    if (item.requireAnyRole && item.requireAnyRole.length > 0) {
      const hasAnyRole = item.requireAnyRole.some(role => hasRole(role));
      if (!hasAnyRole) return false;
    }

    // Check hideForRoles
    if (item.hideForRoles && item.hideForRoles.length > 0) {
      const shouldHide = item.hideForRoles.some(role => hasRole(role));
      if (shouldHide) return false;
    }

    return true;
  };

  // Check if a submenu has any visible items
  const hasVisibleSubmenuItems = (items?: MenuItem[]): boolean => {
    if (!items || items.length === 0) return false;
    return items.some(item => isMenuItemVisible(item));
  };

  // Render a menu item
  const renderMenuItem = (item: MenuItem) => {
    if (!isMenuItemVisible(item)) return null;

    // Item with submenu
    if (item.submenu && item.submenu.length > 0) {
      if (!hasVisibleSubmenuItems(item.submenu)) return null;

      return (
        <li key={item.id} className="has-submenu">
          <span className="menu-label">{t(item.label)}</span>
          <ul className="submenu">
            {item.submenu.map(subItem => renderMenuItem(subItem))}
          </ul>
        </li>
      );
    }

    // Regular item with link
    if (item.path) {
      return (
        <li key={item.id}>
          <Link to={item.path}>{t(item.label)}</Link>
        </li>
      );
    }

    return null;
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          {branding?.companyLogoUrl || branding?.companyLogoPath ? (
            <>
              <img 
                src={branding.companyLogoUrl || branding.companyLogoPath || ''} 
                alt={branding.companyName || 'Company Logo'} 
                className="company-logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <h1>{branding.companyName || 'E-QMS'}</h1>
            </>
          ) : (
            <h1>{branding?.companyName || t('branding.companyName')}</h1>
          )}
        </div>
        <ul className="navbar-menu">
          {menuStructure.map(item => renderMenuItem(item))}
        </ul>
        <div className="navbar-user">
          <span className="user-info">
            <span className="user-name">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username}
            </span>
            <span className="user-role">{highestRoleTitle}</span>
          </span>
          <button onClick={handleLogout}>{t('auth.logout')}</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
