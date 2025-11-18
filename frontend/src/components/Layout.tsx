import { Outlet, Link, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import { useBranding } from '../contexts/BrandingContext';
import '../styles/Layout.css';

function Layout() {
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
            <h1>{branding?.companyName || 'E-QMS'}</h1>
          )}
        </div>
        <ul className="navbar-menu">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/documents">Documents</Link></li>
          <li><Link to="/processes/overview">Processes</Link></li>
          <li><Link to="/pending-changes">Pending Changes</Link></li>
          <li><Link to="/audits">Audits</Link></li>
          <li><Link to="/ncr">NCR</Link></li>
          <li><Link to="/capa">CAPA</Link></li>
          <li><Link to="/risks">Risks</Link></li>
          <li><Link to="/improvement-ideas">Improvements</Link></li>
          <li><Link to="/equipment">Equipment</Link></li>
          <li><Link to="/inspection-mobile">Mobile Inspection</Link></li>
          <li><Link to="/training">Training</Link></li>
          <li><Link to="/training-matrix">Training Matrix</Link></li>
          {canSeeRoleRequirements && (
            <li><Link to="/role-training-requirements">Role Requirements</Link></li>
          )}
          {canSeeExternalAudit && (
            <li><Link to="/external-audit-support">External Audit</Link></li>
          )}
          {canSeeSettings && (
            <li><Link to="/settings">Settings</Link></li>
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
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
