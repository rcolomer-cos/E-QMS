import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRisks,
  getRiskStatistics,
  createRisk,
  updateRiskStatus,
  deleteRisk,
  CreateRiskData,
  RiskFilters,
  calculateRiskScore,
  calculateRiskLevel,
  getRiskLevelColor,
} from '../services/riskService';
import { getUsers } from '../services/userService';
import { Risk, User, RiskStatistics } from '../types';
import '../styles/Risks.css';

function Risks() {
  const navigate = useNavigate();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<RiskStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<RiskFilters>({
    page: 1,
    limit: 20,
    sortBy: 'riskScore',
    sortOrder: 'DESC',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Form state
  const [formData, setFormData] = useState<CreateRiskData>({
    riskNumber: '',
    title: '',
    description: '',
    category: '',
    source: '',
    likelihood: 3,
    impact: 3,
    mitigationStrategy: '',
    mitigationActions: '',
    contingencyPlan: '',
    riskOwner: 0,
    department: '',
    process: '',
    status: 'identified',
    identifiedDate: new Date().toISOString().split('T')[0],
    reviewFrequency: 90,
    affectedStakeholders: '',
    regulatoryImplications: '',
  });

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskData, usersData, statsData] = await Promise.all([
        getRisks(filters),
        getUsers(),
        getRiskStatistics(),
      ]);
      setRisks(riskData.data);
      setPagination(riskData.pagination);
      setUsers(usersData);
      setStatistics(statsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
      }
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRisk(formData);
      await loadData();
      setShowModal(false);
      resetForm();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create risk');
    }
  };

  const handleStatusChange = async (riskId: number, newStatus: Risk['status']) => {
    try {
      await updateRiskStatus(riskId, newStatus);
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update risk status');
    }
  };

  const handleDeleteRisk = async (riskId: number) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) {
      return;
    }
    try {
      await deleteRisk(riskId);
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete risk');
    }
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      riskNumber: '',
      title: '',
      description: '',
      category: '',
      source: '',
      likelihood: 3,
      impact: 3,
      mitigationStrategy: '',
      mitigationActions: '',
      contingencyPlan: '',
      riskOwner: 0,
      department: '',
      process: '',
      status: 'identified',
      identifiedDate: new Date().toISOString().split('T')[0],
      reviewFrequency: 90,
      affectedStakeholders: '',
      regulatoryImplications: '',
    });
  };

  const handleFilterChange = (key: keyof RiskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  const canModify = currentUser?.role === 'admin' || 
                    currentUser?.role === 'manager' || 
                    currentUser?.role === 'auditor';
  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superuser';

  if (loading) {
    return <div className="loading">Loading risks...</div>;
  }

  // Calculate score and level for form preview
  const previewScore = calculateRiskScore(formData.likelihood, formData.impact);
  const previewLevel = calculateRiskLevel(previewScore);

  return (
    <div className="risks-container">
      <div className="risks-header">
        <h1>Risk Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/risks/board')} className="tw-btn tw-btn-secondary">
            View Risk Board
          </button>
          {canModify && (
            <button onClick={handleOpenModal} className="tw-btn tw-btn-primary">
              Create New Risk
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="risk-statistics">
          <div className="stat-card">
            <h3>Total Risks</h3>
            <div className="stat-value">{statistics.totalRisks}</div>
          </div>
          <div className="stat-card">
            <h3>By Level</h3>
            <div className="stat-breakdown">
              <div className="stat-item" style={{ color: getRiskLevelColor('critical') }}>
                Critical: {statistics.byLevel.critical || 0}
              </div>
              <div className="stat-item" style={{ color: getRiskLevelColor('high') }}>
                High: {statistics.byLevel.high || 0}
              </div>
              <div className="stat-item" style={{ color: getRiskLevelColor('medium') }}>
                Medium: {statistics.byLevel.medium || 0}
              </div>
              <div className="stat-item" style={{ color: getRiskLevelColor('low') }}>
                Low: {statistics.byLevel.low || 0}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <h3>By Status</h3>
            <div className="stat-breakdown">
              {Object.entries(statistics.byStatus).map(([status, count]) => (
                <div key={status} className="stat-item">
                  {status}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="risk-filters">
        <select
          value={filters.status || ''}
          onChange={e => handleFilterChange('status', e.target.value || undefined)}
        >
          <option value="">All Statuses</option>
          <option value="identified">Identified</option>
          <option value="assessed">Assessed</option>
          <option value="mitigating">Mitigating</option>
          <option value="monitoring">Monitoring</option>
          <option value="closed">Closed</option>
          <option value="accepted">Accepted</option>
        </select>

        <select
          value={filters.riskLevel || ''}
          onChange={e => handleFilterChange('riskLevel', e.target.value || undefined)}
        >
          <option value="">All Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={filters.sortBy || 'riskScore'}
          onChange={e => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="riskScore">Risk Score</option>
          <option value="residualRiskScore">Residual Risk Score</option>
          <option value="identifiedDate">Identified Date</option>
          <option value="nextReviewDate">Next Review Date</option>
          <option value="title">Title</option>
        </select>

        <select
          value={filters.sortOrder || 'DESC'}
          onChange={e => handleFilterChange('sortOrder', e.target.value as 'ASC' | 'DESC')}
        >
          <option value="DESC">Descending</option>
          <option value="ASC">Ascending</option>
        </select>
      </div>

      {/* Risk List */}
      <div className="risk-list">
        {risks.length === 0 ? (
          <p>No risks found</p>
        ) : (
          <table className="risk-table">
            <thead>
              <tr>
                <th>Risk Number</th>
                <th>Title</th>
                <th>Category</th>
                <th>Likelihood</th>
                <th>Impact</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {risks.map(risk => (
                <tr key={risk.id}>
                  <td>{risk.riskNumber}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => navigate(`/risks/${risk.id}`)}
                    >
                      {risk.title}
                    </button>
                  </td>
                  <td>{risk.category}</td>
                  <td className="text-center">{risk.likelihood}</td>
                  <td className="text-center">{risk.impact}</td>
                  <td className="text-center risk-score">{risk.riskScore}</td>
                  <td>
                    <span
                      className="risk-level-badge"
                      style={{
                        backgroundColor: getRiskLevelColor(risk.riskLevel),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                      }}
                    >
                      {risk.riskLevel?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {canModify ? (
                      <select
                        value={risk.status}
                        onChange={e => handleStatusChange(risk.id, e.target.value as Risk['status'])}
                        className="status-select"
                      >
                        <option value="identified">Identified</option>
                        <option value="assessed">Assessed</option>
                        <option value="mitigating">Mitigating</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="closed">Closed</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    ) : (
                      <span>{risk.status}</span>
                    )}
                  </td>
                  <td>{getUserName(risk.riskOwner)}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/risks/${risk.id}`)}
                      className="btn-view"
                    >
                      View
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteRisk(risk.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Risk Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Risk</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRisk} className="risk-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Risk Number *</label>
                  <input
                    type="text"
                    value={formData.riskNumber}
                    onChange={e => setFormData({ ...formData, riskNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., operational, financial, compliance"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {/* Risk Scoring Section */}
              <div className="risk-scoring-section">
                <h3>Risk Scoring</h3>
                <div className="scoring-explanation">
                  <p>Risk Score = Likelihood × Impact</p>
                  <p>Scale: 1 (very low) to 5 (very high)</p>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Likelihood (1-5) *</label>
                    <select
                      value={formData.likelihood}
                      onChange={e => setFormData({ ...formData, likelihood: parseInt(e.target.value) })}
                      required
                    >
                      <option value="1">1 - Very Unlikely</option>
                      <option value="2">2 - Unlikely</option>
                      <option value="3">3 - Possible</option>
                      <option value="4">4 - Likely</option>
                      <option value="5">5 - Very Likely</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Impact (1-5) *</label>
                    <select
                      value={formData.impact}
                      onChange={e => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                      required
                    >
                      <option value="1">1 - Negligible</option>
                      <option value="2">2 - Minor</option>
                      <option value="3">3 - Moderate</option>
                      <option value="4">4 - Major</option>
                      <option value="5">5 - Catastrophic</option>
                    </select>
                  </div>
                </div>

                <div className="risk-score-preview">
                  <div className="score-display">
                    <span className="label">Risk Score:</span>
                    <span className="value">{previewScore}</span>
                  </div>
                  <div className="level-display">
                    <span className="label">Risk Level:</span>
                    <span
                      className="value"
                      style={{
                        backgroundColor: getRiskLevelColor(previewLevel),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                      }}
                    >
                      {previewLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Risk Owner *</label>
                  <select
                    value={formData.riskOwner}
                    onChange={e => setFormData({ ...formData, riskOwner: parseInt(e.target.value) })}
                    required
                  >
                    <option value="0">Select Owner</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mitigation Strategy</label>
                <textarea
                  value={formData.mitigationStrategy}
                  onChange={e => setFormData({ ...formData, mitigationStrategy: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Mitigation Actions</label>
                <textarea
                  value={formData.mitigationActions}
                  onChange={e => setFormData({ ...formData, mitigationActions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="tw-btn tw-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="tw-btn tw-btn-primary">
                  Create Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Risks;
