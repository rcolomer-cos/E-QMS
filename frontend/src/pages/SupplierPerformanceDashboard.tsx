import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSupplierPerformanceDashboard,
  Supplier,
  SupplierPerformanceDashboard as DashboardData,
} from '../services/supplierService';
import { getCurrentUser } from '../services/authService';
import '../styles/SupplierPerformanceDashboard.css';

function SupplierPerformanceDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadCurrentUser();
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData, riskFilter, categoryFilter]);

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  const hasRole = (roleNames: string[]) => {
    if (!currentUser) return false;
    // Check roleNames array first (preferred)
    const userRoles = currentUser.roleNames || [];
    if (userRoles.length > 0) {
      return roleNames.some(role => userRoles.map((r: string) => r.toLowerCase()).includes(role.toLowerCase()));
    }
    // Fallback: check roles array and extract names
    if (currentUser.roles && currentUser.roles.length > 0) {
      const roleNamesFromRoles = currentUser.roles.map((r: any) => r.name.toLowerCase());
      return roleNames.some(role => roleNamesFromRoles.includes(role.toLowerCase()));
    }
    // Legacy fallback: check single role property
    if (currentUser.role) {
      return roleNames.some(role => role.toLowerCase() === currentUser.role?.toLowerCase());
    }
    return false;
  };

  const canManageSuppliers = hasRole(['superuser', 'admin', 'manager']);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getSupplierPerformanceDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!dashboardData) return;

    let filtered = [...dashboardData.suppliers];

    if (riskFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.riskLevel === riskFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === categoryFilter);
    }

    setFilteredSuppliers(filtered);
  };

  const getUniqueCategories = (): string[] => {
    if (!dashboardData) return [];
    const categories = new Set(dashboardData.suppliers.map(s => s.category));
    return Array.from(categories).sort();
  };

  const getRiskBadgeClass = (riskLevel: string) => {
    const riskMap: Record<string, string> = {
      Low: 'risk-low',
      Medium: 'risk-medium',
      High: 'risk-high',
      Critical: 'risk-critical',
    };
    return riskMap[riskLevel] || 'risk-medium';
  };

  const getGradeBadgeClass = (grade: string) => {
    const gradeMap: Record<string, string> = {
      A: 'grade-a',
      B: 'grade-b',
      C: 'grade-c',
      D: 'grade-d',
      F: 'grade-f',
    };
    return gradeMap[grade] || 'grade-c';
  };

  const getComplianceBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      Compliant: 'compliance-compliant',
      'Non-Compliant': 'compliance-non-compliant',
      'Under Review': 'compliance-review',
    };
    return statusMap[status] || 'compliance-review';
  };

  if (loading) {
    return <div className="page">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="page"><p className="error">{error}</p></div>;
  }

  if (!dashboardData) {
    return <div className="page"><p>No data available</p></div>;
  }

  const stats = dashboardData.statistics;

  return (
    <div className="supplier-dashboard">
      <div className="page-header">
        <h1>Supplier Performance Dashboard</h1>
        <div className="header-actions">
          {canManageSuppliers && (
            <button 
              className="btn-primary"
              onClick={() => navigate('/approved-supplier-list')}
            >
              Manage Suppliers
            </button>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-value">{stats.totalSuppliers || 0}</div>
          <div className="stat-label">Total Suppliers</div>
        </div>
        <div className="stat-card stat-evaluations">
          <div className="stat-value">{stats.totalEvaluations || 0}</div>
          <div className="stat-label">Total Evaluations</div>
        </div>
        <div className="stat-card stat-quality">
          <div className="stat-value">
            {stats.avgQualityRating ? stats.avgQualityRating.toFixed(1) : 'N/A'}
          </div>
          <div className="stat-label">Avg Quality Rating</div>
        </div>
        <div className="stat-card stat-delivery">
          <div className="stat-value">
            {stats.avgOnTimeDeliveryRate ? stats.avgOnTimeDeliveryRate.toFixed(1) + '%' : 'N/A'}
          </div>
          <div className="stat-label">Avg On-Time Delivery</div>
        </div>
        <div className="stat-card stat-compliant">
          <div className="stat-value">{stats.compliantCount || 0}</div>
          <div className="stat-label">Compliant Evaluations</div>
        </div>
        <div className="stat-card stat-non-compliant">
          <div className="stat-value">{stats.nonCompliantCount || 0}</div>
          <div className="stat-label">Non-Compliant</div>
        </div>
        <div className="stat-card stat-critical">
          <div className="stat-value">{stats.criticalSuppliersCount || 0}</div>
          <div className="stat-label">Critical Suppliers</div>
        </div>
      </div>

      {/* Breakdown by Risk Level */}
      <div className="breakdown-section">
        <div className="breakdown-card">
          <h3>Risk Level Distribution</h3>
          <div className="breakdown-list">
            {dashboardData.riskBreakdown && dashboardData.riskBreakdown.length > 0 ? (
              dashboardData.riskBreakdown.map((item) => (
                <div key={item.riskLevel} className="breakdown-item">
                  <span className={`badge ${getRiskBadgeClass(item.riskLevel)}`}>
                    {item.riskLevel}
                  </span>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>

        <div className="breakdown-card">
          <h3>Compliance Trend (Last 6 Months)</h3>
          <div className="breakdown-list">
            {dashboardData.complianceTrend && dashboardData.complianceTrend.length > 0 ? (
              dashboardData.complianceTrend.map((item) => (
                <div key={item.month} className="breakdown-item">
                  <span className="month-label">{item.month}</span>
                  <div className="compliance-counts">
                    <span className="count-compliant">{item.compliant} ✓</span>
                    <span className="count-non-compliant">{item.nonCompliant} ✗</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="table-section">
        <h3>Recent Evaluations (Last 10)</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Evaluation #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Type</th>
                <th>Score</th>
                <th>Rating</th>
                <th>Compliance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">No recent evaluations</td>
                </tr>
              ) : (
                dashboardData.recentEvaluations.map((evaluation) => (
                  <tr key={evaluation.id}>
                    <td>{evaluation.evaluationNumber}</td>
                    <td>
                      <div className="supplier-info">
                        <span className="supplier-name">{evaluation.supplierName}</span>
                        <span className="supplier-number">{evaluation.supplierNumber}</span>
                      </div>
                    </td>
                    <td>{new Date(evaluation.evaluationDate).toLocaleDateString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{evaluation.evaluationType}</td>
                    <td>
                      {evaluation.overallScore !== null && evaluation.overallScore !== undefined
                        ? evaluation.overallScore.toFixed(1)
                        : 'N/A'}
                    </td>
                    <td>
                      {evaluation.overallRating ? (
                        <span className="rating-label">{evaluation.overallRating}</span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getComplianceBadgeClass(evaluation.complianceStatus)}`}>
                        {evaluation.complianceStatus}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {evaluation.evaluationStatus.replace('_', ' ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>Filter Suppliers</h3>
        <div className="filters">
          <div className="filter-group">
            <label>Risk Level:</label>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category:</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => {
              setRiskFilter('all');
              setCategoryFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="table-section">
        <h3>Supplier Performance ({filteredSuppliers.length})</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier #</th>
                <th>Name</th>
                <th>Category</th>
                <th>Risk Level</th>
                <th>Rating</th>
                <th>Grade</th>
                <th>Latest Score</th>
                <th>Latest Compliance</th>
                <th>Evaluations</th>
                <th>Non-Compliant</th>
                {canManageSuppliers && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="no-data">No suppliers match the current filters</td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.supplierNumber}</td>
                    <td>
                      <div className="supplier-info">
                        <span className="supplier-name">{supplier.name}</span>
                        {supplier.criticalSupplier && (
                          <span className="badge badge-critical-supplier">Critical</span>
                        )}
                        {supplier.preferredSupplier && (
                          <span className="badge badge-preferred-supplier">Preferred</span>
                        )}
                      </div>
                    </td>
                    <td>{supplier.category}</td>
                    <td>
                      <span className={`badge ${getRiskBadgeClass(supplier.riskLevel)}`}>
                        {supplier.riskLevel}
                      </span>
                    </td>
                    <td>
                      {supplier.rating !== null && supplier.rating !== undefined ? (
                        <span className="rating-display">
                          {'★'.repeat(supplier.rating)}
                          {'☆'.repeat(5 - supplier.rating)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {supplier.qualityGrade ? (
                        <span className={`badge ${getGradeBadgeClass(supplier.qualityGrade)}`}>
                          {supplier.qualityGrade}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {supplier.latestOverallScore !== null && supplier.latestOverallScore !== undefined
                        ? supplier.latestOverallScore.toFixed(1)
                        : 'N/A'}
                    </td>
                    <td>
                      {supplier.latestComplianceStatus ? (
                        <span className={`badge ${getComplianceBadgeClass(supplier.latestComplianceStatus)}`}>
                          {supplier.latestComplianceStatus}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{supplier.totalEvaluations}</td>
                    <td>
                      {supplier.nonCompliantEvaluations > 0 ? (
                        <span className="warning-count">{supplier.nonCompliantEvaluations}</span>
                      ) : (
                        <span className="ok-count">0</span>
                      )}
                    </td>
                    {canManageSuppliers && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/approved-supplier-list?supplier=${supplier.id}`)}
                            title="View Details"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SupplierPerformanceDashboard;
