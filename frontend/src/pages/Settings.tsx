import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import CompanyBranding from './CompanyBranding';
import Processes from './Processes';
import Users from './Users';
import '../styles/Settings.css';

function Settings() {
  const user = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedTabs = ['branding', 'processes', 'users'] as const;
  type TabKey = typeof allowedTabs[number];
  const initialTab = (searchParams.get('tab') as TabKey) ?? 'branding';
  const [activeTab, setActiveTab] = useState<TabKey>(allowedTabs.includes(initialTab as TabKey) ? (initialTab as TabKey) : 'branding');

  const roleNames: string[] = ((user?.roles?.map(r => r.name)) || (user?.role ? [user.role as string] : [])) as string[];
  const normalizeRole = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n === 'administrator' || n.startsWith('admin')) return 'admin';
    if (n === 'super user' || n === 'super-user' || n.startsWith('super')) return 'superuser';
    if (n.startsWith('manager')) return 'manager';
    if (n.startsWith('auditor')) return 'auditor';
    return n;
  };
  const hasRole = (r: string) => roleNames.map(normalizeRole).includes(r.toLowerCase());
  const canBranding = hasRole('admin') || hasRole('manager') || hasRole('superuser');
  const canProcesses = hasRole('admin') || hasRole('manager') || hasRole('superuser');
  const canUsers = hasRole('admin') || hasRole('superuser');

  // Determine primary permission label per tab
  const bestRole = (roles: string[]) => roles.find((r) => hasRole(r)) || '';
  const tabBadges = useMemo(() => ({
    branding: canBranding ? (bestRole(['superuser', 'admin', 'manager']) || 'allowed') : 'no access',
    processes: canProcesses ? (bestRole(['superuser', 'admin', 'manager']) || 'allowed') : 'no access',
    users: canUsers ? (bestRole(['superuser', 'admin']) || 'allowed') : 'no access',
  }), [canBranding, canProcesses, canUsers]);

  const badgeLabel = (key: TabKey) => {
    const v = (tabBadges[key] || '').toString();
    if (!v) return '';
    if (v === 'no access') return 'No access';
    return v.charAt(0).toUpperCase() + v.slice(1) + ' access';
  };

  // Keep URL in sync when tab changes
  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Note: legacy settings grid removed in favor of tabbed content for key areas

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Configure and manage system settings</p>
        </div>
      </div>

      {/* Tabs for key settings */}
      <div className="settings-tabs">
        <div className="tab-list" role="tablist" aria-label="Settings Tabs">
          <button
            role="tab"
            aria-selected={activeTab === 'branding'}
            className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            Branding <span className="tab-badge">{badgeLabel('branding')}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'processes'}
            className={`tab ${activeTab === 'processes' ? 'active' : ''}`}
            onClick={() => setActiveTab('processes')}
          >
            Processes <span className="tab-badge">{badgeLabel('processes')}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'users'}
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users <span className="tab-badge">{badgeLabel('users')}</span>
          </button>
        </div>

        <div className="tab-panels">
          {activeTab === 'branding' && (
            <div className="tab-panel" role="tabpanel">
              {canBranding ? (
                <CompanyBranding />
              ) : (
                <div className="no-results">You do not have permission to view Branding settings.</div>
              )}
            </div>
          )}
          {activeTab === 'processes' && (
            <div className="tab-panel" role="tabpanel">
              {canProcesses ? (
                <Processes />
              ) : (
                <div className="no-results">You do not have permission to manage Processes.</div>
              )}
            </div>
          )}
          {activeTab === 'users' && (
            <div className="tab-panel" role="tabpanel">
              {canUsers ? (
                <Users />
              ) : (
                <div className="no-results">You do not have permission to manage Users.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
