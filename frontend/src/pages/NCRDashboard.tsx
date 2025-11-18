import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNCRMetrics,
  getNCRs,
  NCRMetrics,
} from '../services/ncrService';
import { NCR } from '../types';
import '../styles/NCRDashboard.css';

function NCRDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<NCRMetrics | null>(null);
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [filteredNcrs, setFilteredNcrs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ncrs, statusFilter, severityFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [metricsData, ncrsResponse] = await Promise.all([
        getNCRMetrics(),
        getNCRs({ limit: 100 }), // Get more items for filtering
      ]);

      setMetrics(metricsData);
      setNcrs(ncrsResponse.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ncrs];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ncr => ncr.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(ncr => ncr.severity === severityFilter);
    }

    setFilteredNcrs(filtered);
  };

  const handleViewNCR = (ncrId: number) => {
    navigate(`/ncr/${ncrId}`);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      open: 'tw-badge tw-badge-info',
      in_progress: 'tw-badge tw-badge-warning',
      resolved: 'tw-badge tw-badge-success',
      closed: 'tw-badge tw-badge-secondary',
      rejected: 'tw-badge tw-badge-danger',
    };
    return statusMap[status] || 'tw-badge tw-badge-info';
  };

  const getSeverityBadgeClass = (severity: string) => {
    const severityMap: Record<string, string> = {
      minor: 'tw-badge tw-badge-info',
      major: 'tw-badge tw-badge-warning',
      critical: 'tw-badge tw-badge-danger',
    };
    return severityMap[severity] || 'tw-badge tw-badge-info';
  };

  if (loading) {
    return <div className="page">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="page"><p className="error">{error}</p></div>;
  }

  return (
    <div className="ncr-dashboard">
      <div className="page-header">
        <h1>NCR Metrics Dashboard</h1>
        <button className="tw-btn tw-btn-secondary" onClick={() => navigate('/ncr')}>
          View All NCRs
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-open">
          <div className="stat-value">{metrics?.totalOpen || 0}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card stat-in-progress">
          <div className="stat-value">{metrics?.totalInProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-resolved">
          <div className="stat-value">{metrics?.totalResolved || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card stat-closed">
          <div className="stat-value">{metrics?.totalClosed || 0}</div>
          <div className="stat-label">Closed</div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-value">{metrics?.totalRejected || 0}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card stat-closure">
          <div className="stat-value">{metrics?.averageClosureTime || 0}</div>
          <div className="stat-label">Avg. Closure Days</div>
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="breakdown-section">
        <div className="breakdown-card">
          <h3>By Severity</h3>
          <div className="breakdown-list">
            {metrics?.bySeverity && metrics.bySeverity.length > 0 ? (
              metrics.bySeverity.map((item) => (
                <div key={item.severity} className="breakdown-item">
                  <span className={getSeverityBadgeClass(item.severity)}>
                    {item.severity}
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
          <h3>By Category</h3>
          <div className="breakdown-list">
            {metrics?.byCategory && metrics.byCategory.length > 0 ? (
              metrics.byCategory.slice(0, 5).map((item) => (
                <div key={item.category} className="breakdown-item">
                  <span className="category-label">{item.category}</span>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>

        <div className="breakdown-card">
          <h3>By Source</h3>
          <div className="breakdown-list">
            {metrics?.bySource && metrics.bySource.length > 0 ? (
              metrics.bySource.slice(0, 5).map((item) => (
                <div key={item.source} className="breakdown-item">
                  <span className="source-label">{item.source}</span>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {metrics?.monthlyTrend && metrics.monthlyTrend.length > 0 && (
        <div className="trend-section">
          <h3>NCR Monthly Trend (Last 12 Months)</h3>
          <div className="trend-chart">
            {metrics.monthlyTrend.map((item) => (
              <div key={item.month} className="trend-bar-container">
                <div 
                  className="trend-bar" 
                  style={{ height: `${(item.count / Math.max(...metrics.monthlyTrend.map(m => m.count))) * 100}%` }}
                  title={`${item.month}: ${item.count} NCRs`}
                >
                  <span className="trend-count">{item.count}</span>
                </div>
                <div className="trend-label">{item.month.substring(5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filter NCRs</h3>
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Severity:</label>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          <button 
            className="tw-btn tw-btn-secondary"
            onClick={() => {
              setStatusFilter('all');
              setSeverityFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* NCR Table */}
      <div className="table-section">
        <h3>NCR Items ({filteredNcrs.length})</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>NCR Number</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Category</th>
                <th>Status</th>
                <th>Detected Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNcrs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">No NCRs match the current filters</td>
                </tr>
              ) : (
                filteredNcrs.map((ncr) => (
                  <tr key={ncr.id}>
                    <td>{ncr.ncrNumber}</td>
                    <td>{ncr.title}</td>
                    <td>
                      <span className={`badge ${getSeverityBadgeClass(ncr.severity)}`}>
                        {ncr.severity}
                      </span>
                    </td>
                    <td>{ncr.category}</td>
                    <td>
                      <span className={getStatusBadgeClass(ncr.status)}>
                        {ncr.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(ncr.detectedDate).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="tw-btn tw-btn-small tw-btn-primary"
                        onClick={() => handleViewNCR(ncr.id!)}
                      >
                        View
                      </button>
                    </td>
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

export default NCRDashboard;
