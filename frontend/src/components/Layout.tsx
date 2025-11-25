import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout, getCurrentUser } from '../services/authService';
import { getCurrentUser as fetchCurrentUser } from '../services/userService';
import { useBranding } from '../contexts/BrandingContext';
import { useModuleVisibility } from '../contexts/ModuleVisibilityContext';
import { menuStructure, MenuItem } from '../config/menuStructure';
import Footer from './Footer';
import Avatar from './Avatar';
import { User } from '../types';
import '../styles/Layout.css';

function Layout() {
  const { t } = useTranslation();
  const cachedUser = getCurrentUser();
  const [user, setUser] = useState<User | null>(cachedUser);

  useEffect(() => {
    // Fetch current user data to get latest avatarUrl
    const loadUser = async () => {
      try {
        const freshUser = await fetchCurrentUser();
        setUser(freshUser);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Keep cached user if fetch fails
      }
    };
    loadUser();
  }, []);
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
          <Link to={item.path} onClick={closeMobileMenu}>{t(item.label)}</Link>
        </li>
      );
    }

    return null;
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('.navbar-menu') && !target.closest('.hamburger-btn')) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <button 
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <span className="app-name">E-QMS</span>
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
        <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {menuStructure.map(item => renderMenuItem(item))}
        </ul>
        <div className="navbar-user">
          <Link to="/profile" className="user-profile-link">
            <Avatar user={user} size="small" />
          </Link>
          <span className="user-info">
            <Link to="/profile" className="user-name-link">
              <span className="user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username}
              </span>
            </Link>
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
