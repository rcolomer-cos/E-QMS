import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout, getCurrentUser } from '../services/authService';
import { useBranding } from '../contexts/BrandingContext';
import { useModuleVisibility } from '../contexts/ModuleVisibilityContext';
import '../styles/Layout.css';

function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          {/* Dashboard - Always visible */}
          <li><Link to="/">{t('navigation.dashboard')}</Link></li>

          {/* Quality System */}
          {(isModuleEnabled('documents') || isModuleEnabled('processes')) && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.qualitySystem')}</span>
              <ul className="submenu">
                {isModuleEnabled('documents') && (
                  <li><Link to="/documents">{t('navigation.documents')}</Link></li>
                )}
                {isModuleEnabled('processes') && (
                  <li><Link to="/processes/overview">{t('navigation.processes')}</Link></li>
                )}
                <li><Link to="/pending-changes">{t('navigation.pendingChanges')}</Link></li>
              </ul>
            </li>
          )}

          {/* Operations & Quality Control */}
          {(isModuleEnabled('audits') || isModuleEnabled('ncr') || isModuleEnabled('capa') || isModuleEnabled('inspection')) && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.operations')}</span>
              <ul className="submenu">
                {isModuleEnabled('audits') && (
                  <li><Link to="/audits">{t('navigation.audits')}</Link></li>
                )}
                {canSeeExternalAudit && isModuleEnabled('audits') && (
                  <li><Link to="/external-audit-support">{t('navigation.externalAudit')}</Link></li>
                )}
                {isModuleEnabled('ncr') && (
                  <li><Link to="/ncr">{t('navigation.ncr')}</Link></li>
                )}
                {isModuleEnabled('capa') && (
                  <li><Link to="/capa">{t('navigation.capa')}</Link></li>
                )}
                {isModuleEnabled('inspection') && (
                  <li><Link to="/inspection-mobile">{t('navigation.mobileInspection')}</Link></li>
                )}
              </ul>
            </li>
          )}

          {/* Equipment & Assets */}
          {isModuleEnabled('equipment') && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.equipmentAssets')}</span>
              <ul className="submenu">
                <li><Link to="/equipment">{t('navigation.equipment')}</Link></li>
                <li><Link to="/calibration-records">{t('navigation.calibrationRecords')}</Link></li>
                <li><Link to="/service-records">{t('navigation.serviceRecords')}</Link></li>
                {isModuleEnabled('inspection') && (
                  <li><Link to="/inspection-records">{t('navigation.inspectionRecords')}</Link></li>
                )}
              </ul>
            </li>
          )}

          {/* People & Organization */}
          <li className="has-submenu">
            <span className="menu-label">{t('navigation.peopleOrganization')}</span>
            <ul className="submenu">
              <li><Link to="/organizational-chart">{t('navigation.orgChart')}</Link></li>
              {isModuleEnabled('training') && (
                <>
                  <li><Link to="/training">{t('navigation.training')}</Link></li>
                  <li><Link to="/training-matrix">{t('navigation.trainingMatrix')}</Link></li>
                  {canSeeRoleRequirements && (
                    <li><Link to="/role-training-requirements">{t('navigation.roleRequirements')}</Link></li>
                  )}
                </>
              )}
              {isAdminOrManagerOrSuper && (
                <>
                  <li><Link to="/users">{t('navigation.users')}</Link></li>
                  <li><Link to="/groups">{t('navigation.groups')}</Link></li>
                  <li><Link to="/departments">{t('navigation.departments')}</Link></li>
                </>
              )}
            </ul>
          </li>

          {/* Analysis & Improvement */}
          {(isModuleEnabled('risks') || isModuleEnabled('improvements')) && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.analysis')}</span>
              <ul className="submenu">
                {isModuleEnabled('risks') && (
                  <>
                    <li><Link to="/risks">{t('navigation.risks')}</Link></li>
                    <li><Link to="/risks/board">{t('navigation.riskBoard')}</Link></li>
                  </>
                )}
                {isModuleEnabled('improvements') && (
                  <>
                    <li><Link to="/improvement-ideas">{t('navigation.improvements')}</Link></li>
                    <li><Link to="/swot-analysis">{t('navigation.swotAnalysis')}</Link></li>
                  </>
                )}
              </ul>
            </li>
          )}

          {/* Suppliers (if visible) */}
          {isAdminOrManagerOrSuper && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.suppliers')}</span>
              <ul className="submenu">
                <li><Link to="/supplier-performance">{t('navigation.supplierPerformance')}</Link></li>
                <li><Link to="/approved-supplier-list">{t('navigation.approvedSuppliers')}</Link></li>
              </ul>
            </li>
          )}

          {/* Administration */}
          {canSeeSettings && (
            <li className="has-submenu">
              <span className="menu-label">{t('navigation.admin')}</span>
              <ul className="submenu">
                <li><Link to="/settings">{t('navigation.settings')}</Link></li>
                <li><Link to="/system-settings">{t('navigation.systemSettings')}</Link></li>
                <li><Link to="/company-branding">{t('navigation.companyBranding')}</Link></li>
                <li><Link to="/email-templates">{t('navigation.emailTemplates')}</Link></li>
                <li><Link to="/api-keys">{t('navigation.apiKeys')}</Link></li>
                <li><Link to="/backup-management">{t('navigation.backupManagement')}</Link></li>
                <li><Link to="/audit-logs">{t('navigation.auditLogs')}</Link></li>
                {hasRole('superuser') && (
                  <li><Link to="/data-import">{t('navigation.dataImport')}</Link></li>
                )}
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
