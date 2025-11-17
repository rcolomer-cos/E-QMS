import { useEffect, useState } from 'react';
import {
  getRoleTrainingRequirements,
  getUsersWithMissingCompetencies,
  RoleTrainingRequirement,
  MissingCompetency,
} from '../services/roleTrainingRequirementsService';
import '../styles/RoleTrainingRequirements.css';

function RoleTrainingRequirements() {
  const [requirements, setRequirements] = useState<RoleTrainingRequirement[]>([]);
  const [missingCompetencies, setMissingCompetencies] = useState<MissingCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requirements' | 'compliance'>('requirements');
  const [filters, setFilters] = useState({
    status: 'active',
    roleId: undefined as number | undefined,
    priority: undefined as string | undefined,
  });

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'requirements') {
        const response = await getRoleTrainingRequirements({
          status: filters.status,
          roleId: filters.roleId,
          priority: filters.priority,
        });
        setRequirements(response.data);
      } else {
        const response = await getUsersWithMissingCompetencies({
          roleId: filters.roleId,
        });
        setMissingCompetencies(response.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'badge badge-critical';
      case 'high':
        return 'badge badge-high';
      case 'normal':
        return 'badge badge-normal';
      case 'low':
        return 'badge badge-low';
      default:
        return 'badge';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'missing':
        return 'badge badge-danger';
      case 'expired':
        return 'badge badge-error';
      case 'expiring_soon':
        return 'badge badge-warning';
      case 'active':
        return 'badge badge-success';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="role-training-requirements-page">
      <h1>Role Training Requirements</h1>

      <div className="tabs">
        <button
          className={activeTab === 'requirements' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('requirements')}
        >
          Requirements
        </button>
        <button
          className={activeTab === 'compliance' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance Gaps
        </button>
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deprecated">Deprecated</option>
        </select>

        {activeTab === 'requirements' && (
          <select
            value={filters.priority || ''}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value || undefined })
            }
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        )}
      </div>

      {activeTab === 'requirements' ? (
        <div className="requirements-list">
          <h2>Defined Requirements</h2>
          {requirements.length === 0 ? (
            <p className="empty-message">No requirements defined</p>
          ) : (
            <table className="requirements-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Competency</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Mandatory</th>
                  <th>Regulatory</th>
                  <th>Grace Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id}>
                    <td>{req.roleDisplayName}</td>
                    <td>
                      <div className="competency-info">
                        <strong>{req.competencyName}</strong>
                        <span className="code">{req.competencyCode}</span>
                      </div>
                    </td>
                    <td>{req.competencyCategory}</td>
                    <td>
                      <span className={getPriorityBadgeClass(req.priority)}>
                        {req.priority}
                      </span>
                    </td>
                    <td>{req.isMandatory ? '✓' : '-'}</td>
                    <td>{req.isRegulatory ? '✓' : '-'}</td>
                    <td>{req.gracePeriodDays ? `${req.gracePeriodDays} days` : '-'}</td>
                    <td>
                      <span className={getStatusBadgeClass(req.status)}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="compliance-gaps">
          <h2>Users with Missing Competencies</h2>
          {missingCompetencies.length === 0 ? (
            <p className="empty-message success">
              ✓ All users have their required competencies
            </p>
          ) : (
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Missing Competency</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Mandatory</th>
                  <th>Regulatory</th>
                </tr>
              </thead>
              <tbody>
                {missingCompetencies.map((comp, index) => (
                  <tr key={index}>
                    <td>
                      <div className="user-info">
                        <strong>{comp.userName}</strong>
                        <span className="email">{comp.userEmail}</span>
                      </div>
                    </td>
                    <td>{comp.roleName}</td>
                    <td>
                      <div className="competency-info">
                        <strong>{comp.competencyName}</strong>
                        <span className="code">{comp.competencyCode}</span>
                      </div>
                    </td>
                    <td>{comp.competencyCategory}</td>
                    <td>
                      <span className={getPriorityBadgeClass(comp.priority)}>
                        {comp.priority}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(comp.status)}>
                        {comp.status}
                      </span>
                    </td>
                    <td>{comp.isMandatory ? '✓' : '-'}</td>
                    <td>{comp.isRegulatory ? '✓' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default RoleTrainingRequirements;
