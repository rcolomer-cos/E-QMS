import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout, getCurrentUser } from '../services/authService';
import { useBranding } from '../contexts/BrandingContext';
import '../styles/Layout.css';

function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getCurrentUser();
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
  const isAdminOrManagerOrSuper = hasRole('admin') || hasRole('manager') || hasRole('superuser');
  const canSeeRoleRequirements = isAdminOrManagerOrSuper;
  const canSeeExternalAudit = isAdminOrManagerOrSuper || hasRole('auditor');
  const canSeeSettings = isAdminOrManagerOrSuper;

  const rolePriority = ['superuser', 'admin', 'manager', 'auditor', 'user', 'viewer'];
  const highestRoleLower = rolePriority.find(r => hasRole(r)) || '';
  const highestRoleTitle = highestRoleLower
    ? highestRoleLower.charAt(0).toUpperCase() + highestRoleLower.slice(1)
    : '';
  const { branding } = useBranding();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <li className="top-item"><Link to="/">{t('navigation.dashboard')}</Link></li>

          <li className="has-submenu">
            <span className="menu-label">{t('navigation.quality')}</span>
            <ul className="submenu">
              <li><Link to="/processes/overview">{t('navigation.processes')}</Link></li>
              <li><Link to="/documents">{t('navigation.documents')}</Link></li>
              <li><Link to="/pending-changes">{t('navigation.pendingChanges')}</Link></li>
            </ul>
          </li>

          <li className="has-submenu">
            <span className="menu-label">{t('navigation.audits')}</span>
            <ul className="submenu">
              <li><Link to="/audits">{t('navigation.audits')}</Link></li>
              {canSeeExternalAudit && (
                <li><Link to="/external-audit-support">{t('navigation.externalAudit')}</Link></li>
              )}
            </ul>
          </li>

          <li className="has-submenu">
            <span className="menu-label">{t('navigation.ncrCapa')}</span>
            <ul className="submenu">
              <li><Link to="/ncr">{t('navigation.ncr')}</Link></li>
              <li><Link to="/capa">{t('navigation.capa')}</Link></li>
              <li><Link to="/improvement-ideas">{t('navigation.improvements')}</Link></li>
            </ul>
          </li>

          <li className="has-submenu">
            <span className="menu-label">{t('navigation.risks')}</span>
            <ul className="submenu">
              <li><Link to="/risks">{t('navigation.risks')}</Link></li>
            </ul>
          </li>

          <li className="has-submenu">
            <span className="menu-label">{t('navigation.operations')}</span>
            <ul className="submenu">
              <li><Link to="/equipment">{t('navigation.equipment')}</Link></li>
              <li><Link to="/inspection-mobile">{t('navigation.mobileInspection')}</Link></li>
            </ul>
          </li>

          <li className="has-submenu">
            <span className="menu-label">{t('navigation.training')}</span>
            <ul className="submenu">
              <li><Link to="/training">{t('navigation.training')}</Link></li>
              <li><Link to="/training-matrix">{t('navigation.trainingMatrix')}</Link></li>
              {canSeeRoleRequirements && (
                <li><Link to="/role-training-requirements">{t('navigation.roleRequirements')}</Link></li>
              )}
            </ul>
          </li>

          {canSeeSettings && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.admin')}</span>
              <ul className="submenu">
                <li><Link to="/settings">{t('navigation.settings')}</Link></li>
              </ul>
            </li>
          )}
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
    </div>
  );
}

export default Layout;
