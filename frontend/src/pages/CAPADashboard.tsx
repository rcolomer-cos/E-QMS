import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCAPADashboardStats,
  getCAPAs,
  CAPADashboardStats,
  CAPA as CAPAType,
} from '../services/capaService';
import '../styles/CAPADashboard.css';

function CAPADashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CAPADashboardStats | null>(null);
  const [capas, setCapas] = useState<CAPAType[]>([]);
  const [filteredCapas, setFilteredCapas] = useState<CAPAType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capas, statusFilter, priorityFilter, typeFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, capasResponse] = await Promise.all([
        getCAPADashboardStats(),
        getCAPAs({ limit: 100 }), // Get more items for filtering
      ]);

      setStats(statsData);
      setCapas(capasResponse.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...capas];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(capa => capa.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(capa => capa.priority === priorityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(capa => capa.type === typeFilter);
    }

    setFilteredCapas(filtered);
  };

  const handleViewCAPA = (capaId: number) => {
    navigate(`/capa/${capaId}`);
  };

  const isOverdue = (targetDate: string, status: string) => {
    return new Date(targetDate) < new Date() && !['completed', 'verified', 'closed'].includes(status);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      open: 'status-open',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      verified: 'status-verified',
      closed: 'status-closed',
    };
    return statusMap[status] || 'status-open';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high',
      urgent: 'priority-urgent',
    };
    return priorityMap[priority] || 'priority-low';
  };

  if (loading) {
    return <div className="page">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="page"><p className="error">{error}</p></div>;
  }

  return (
    <div className="capa-dashboard">
      <div className="page-header">
        <h1>CAPA Status Dashboard</h1>
        <button className="btn-secondary" onClick={() => navigate('/capa')}>
          View All CAPAs
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-open">
          <div className="stat-value">{stats?.totalOpen || 0}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card stat-in-progress">
          <div className="stat-value">{stats?.totalInProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-value">{stats?.totalCompleted || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card stat-verified">
          <div className="stat-value">{stats?.totalVerified || 0}</div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card stat-closed">
          <div className="stat-value">{stats?.totalClosed || 0}</div>
          <div className="stat-label">Closed</div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-value">{stats?.totalOverdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {/* Breakdown by Priority and Type */}
      <div className="breakdown-section">
        <div className="breakdown-card">
          <h3>By Priority</h3>
          <div className="breakdown-list">
            {stats?.byPriority && stats.byPriority.length > 0 ? (
              stats.byPriority.map((item) => (
                <div key={item.priority} className="breakdown-item">
                  <span className={`badge ${getPriorityBadgeClass(item.priority)}`}>
                    {item.priority}
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
          <h3>By Type</h3>
          <div className="breakdown-list">
            {stats?.byType && stats.byType.length > 0 ? (
              stats.byType.map((item) => (
                <div key={item.type} className="breakdown-item">
                  <span className="type-label">{item.type}</span>
                  <span className="breakdown-count">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h3>Filter CAPAs</h3>
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
            </select>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
              setTypeFilter('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* CAPA Table */}
      <div className="table-section">
        <h3>CAPA Items ({filteredCapas.length})</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>CAPA Number</th>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action Owner</th>
                <th>Target Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCapas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">No CAPAs match the current filters</td>
                </tr>
              ) : (
                filteredCapas.map((capa) => (
                  <tr 
                    key={capa.id} 
                    className={isOverdue(capa.targetDate, capa.status) ? 'overdue-row' : ''}
                  >
                    <td>{capa.capaNumber}</td>
                    <td>{capa.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{capa.type}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(capa.priority)}`}>
                        {capa.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(capa.status)}`}>
                        {capa.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{capa.actionOwnerName || `User ${capa.actionOwner}`}</td>
                    <td>
                      {new Date(capa.targetDate).toLocaleDateString()}
                      {isOverdue(capa.targetDate, capa.status) && (
                        <span className="overdue-badge">⚠ OVERDUE</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn-small"
                        onClick={() => handleViewCAPA(capa.id)}
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

export default CAPADashboard;
