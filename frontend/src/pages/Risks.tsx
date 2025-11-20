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
import { useTranslation } from 'react-i18next';

function Risks() {
  const { t } = useTranslation();
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
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
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
    
    // Validate required fields
    if (!formData.riskOwner || formData.riskOwner === 0) {
      setError('Please select a risk owner');
      return;
    }
    
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

  // Check user roles - handle both legacy single role and new roles array
  const userRoles = currentUser?.roleNames || 
                    currentUser?.roles?.map(r => r.name) || 
                    (currentUser?.role ? [currentUser.role] : []);
  
  const canModify = userRoles.some(role => ['admin', 'manager', 'superuser'].includes(role));
  const canDelete = userRoles.some(role => ['admin', 'manager', 'superuser'].includes(role));

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  // Calculate score and level for form preview
  const previewScore = calculateRiskScore(formData.likelihood, formData.impact);
  const previewLevel = calculateRiskLevel(previewScore);

  return (
    <div className="risks-container">
      <div className="risks-header">
        <h1>{t('riskManagement.title')}</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/risks/board')} className="tw-btn tw-btn-secondary">
            {t('riskManagement.viewRiskBoard')}
          </button>
          {canModify && (
            <button onClick={handleOpenModal} className="tw-btn tw-btn-primary">
              {t('riskManagement.createNewRisk')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{t(error) || error}</div>}

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="risk-statistics">
          <div className="stat-card">
            <h3>{t('riskManagement.totalRisks')}</h3>
            <div className="stat-value">{statistics.totalRisks}</div>
          </div>
          <div className="stat-card">
            <h3>{t('riskManagement.byLevel')}</h3>
            <div className="stat-breakdown">
              <div className="stat-item" style={{ color: getRiskLevelColor('critical') }}>
                {t('riskManagement.critical')}: {statistics.byLevel.critical || 0}
              </div>
              <div className="stat-item" style={{ color: getRiskLevelColor('high') }}>
                {t('riskManagement.high')}: {statistics.byLevel.high || 0}
              </div>
              <div className="stat-item" style={{ color: getRiskLevelColor('medium') }}>
                {t('riskManagement.medium')}: {statistics.byLevel.medium || 0}
              </div>
              <div className="stat-item" style={{ color: getRiskLevelColor('low') }}>
                {t('riskManagement.low')}: {statistics.byLevel.low || 0}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <h3>{t('riskManagement.byStatus')}</h3>
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
          <option value="">{t('riskManagement.allStatuses')}</option>
          <option value="identified">{t('riskManagement.status.identified')}</option>
          <option value="assessed">{t('riskManagement.status.assessed')}</option>
          <option value="mitigating">{t('riskManagement.status.mitigating')}</option>
          <option value="monitoring">{t('riskManagement.status.monitoring')}</option>
          <option value="closed">{t('riskManagement.status.closed')}</option>
          <option value="accepted">{t('riskManagement.status.accepted')}</option>
        </select>

        <select
          value={filters.riskLevel || ''}
          onChange={e => handleFilterChange('riskLevel', e.target.value || undefined)}
        >
          <option value="">{t('riskManagement.allLevels')}</option>
          <option value="low">{t('riskManagement.low')}</option>
          <option value="medium">{t('riskManagement.medium')}</option>
          <option value="high">{t('riskManagement.high')}</option>
          <option value="critical">{t('riskManagement.critical')}</option>
        </select>

        <select
          value={filters.sortBy || 'riskScore'}
          onChange={e => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="riskScore">{t('riskManagement.riskScore')}</option>
          <option value="residualRiskScore">{t('riskManagement.residualRiskScore')}</option>
          <option value="identifiedDate">{t('riskManagement.identifiedDate')}</option>
          <option value="nextReviewDate">{t('riskManagement.nextReviewDate')}</option>
          <option value="title">{t('riskManagement.titleLabel')}</option>
        </select>

        <select
          value={filters.sortOrder || 'DESC'}
          onChange={e => handleFilterChange('sortOrder', e.target.value as 'ASC' | 'DESC')}
        >
          <option value="DESC">{t('riskManagement.descending')}</option>
          <option value="ASC">{t('riskManagement.ascending')}</option>
        </select>
      </div>

      {/* Risk List */}
      <div className="risk-list">
        {risks.length === 0 ? (
          <p>{t('riskManagement.noRisksFound')}</p>
        ) : (
          <table className="risk-table">
            <thead>
              <tr>
                <th>{t('riskManagement.riskNumber')}</th>
                <th>{t('riskManagement.titleLabel')}</th>
                <th>{t('riskManagement.category')}</th>
                <th>{t('riskManagement.likelihood')}</th>
                <th>{t('riskManagement.impact')}</th>
                <th>{t('riskManagement.riskScore')}</th>
                <th>{t('riskManagement.riskLevel')}</th>
                <th>{t('common.status')}</th>
                <th>{t('riskManagement.owner')}</th>
                <th>{t('common.actions')}</th>
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
                      title={t('common.view')}
                    >
                      ✏️
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteRisk(risk.id)}
                        className="btn-delete"
                        title={t('common.delete')}
                      >
                        🗑️
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
            {t('common.previous')}
          </button>
          <span>
            {t('riskManagement.pageOf', { page: pagination.page, pages: pagination.pages })}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Create Risk Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('riskManagement.createNewRisk')}</h2>
              <button onClick={handleCloseModal} className="close-button">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRisk} className="risk-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('riskManagement.riskNumber')}</label>
                  <input
                    type="text"
                    value="Auto-generated (RID-XXXXXX)"
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>{t('riskManagement.category')} *</label>
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
                <label>{t('riskManagement.titleLabel')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('riskManagement.description')} *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {/* Risk Scoring Section */}
              <div className="risk-scoring-section">
                <h3>{t('riskManagement.riskScoring')}</h3>
                <div className="scoring-explanation">
                  <p>{t('riskManagement.riskScoreFormula')}</p>
                  <p>{t('riskManagement.scaleExplanation')}</p>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('riskManagement.likelihood')} (1-5) *</label>
                    <select
                      value={formData.likelihood}
                      onChange={e => setFormData({ ...formData, likelihood: parseInt(e.target.value) })}
                      required
                    >
                      <option value="1">{t('riskManagement.likelihood1')}</option>
                      <option value="2">{t('riskManagement.likelihood2')}</option>
                      <option value="3">{t('riskManagement.likelihood3')}</option>
                      <option value="4">{t('riskManagement.likelihood4')}</option>
                      <option value="5">{t('riskManagement.likelihood5')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('riskManagement.impact')} (1-5) *</label>
                    <select
                      value={formData.impact}
                      onChange={e => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                      required
                    >
                      <option value="1">{t('riskManagement.impact1')}</option>
                      <option value="2">{t('riskManagement.impact2')}</option>
                      <option value="3">{t('riskManagement.impact3')}</option>
                      <option value="4">{t('riskManagement.impact4')}</option>
                      <option value="5">{t('riskManagement.impact5')}</option>
                    </select>
                  </div>
                </div>

                <div className="risk-score-preview">
                  <div className="score-display">
                    <span className="label">{t('riskManagement.riskScore')}:</span>
                    <span className="value">{previewScore}</span>
                  </div>
                  <div className="level-display">
                    <span className="label">{t('riskManagement.riskLevel')}:</span>
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
                  <label>{t('riskManagement.riskOwner')} *</label>
                  <select
                    value={formData.riskOwner}
                    onChange={e => setFormData({ ...formData, riskOwner: parseInt(e.target.value) })}
                    required
                    style={formData.riskOwner === 0 ? { borderColor: '#dc3545' } : {}}
                  >
                    <option value="0" disabled>{t('riskManagement.selectRiskOwner')}</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                  {formData.riskOwner === 0 && (
                    <small style={{ color: '#dc3545' }}>Risk owner is required</small>
                  )}
                </div>

                <div className="form-group">
                  <label>{t('riskManagement.department')}</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('riskManagement.mitigationStrategy')}</label>
                <textarea
                  value={formData.mitigationStrategy}
                  onChange={e => setFormData({ ...formData, mitigationStrategy: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>{t('riskManagement.mitigationActions')}</label>
                <textarea
                  value={formData.mitigationActions}
                  onChange={e => setFormData({ ...formData, mitigationActions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal} className="tw-btn tw-btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="tw-btn tw-btn-primary">
                  {t('riskManagement.createRisk')}
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
