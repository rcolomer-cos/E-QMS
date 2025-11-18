import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getImprovementIdeas,
  getImprovementIdeaStatistics,
  ImprovementIdeaFilters,
  ImprovementIdeaStatisticsFilters,
  getStatusDisplayName,
} from '../services/improvementIdeaService';
import { ImprovementIdea, ImprovementIdeaStatistics } from '../types';
import DonutChart, { DonutChartDataItem } from '../components/charts/DonutChart';
import BarChart, { BarChartDataItem } from '../components/charts/BarChart';
import '../styles/ImprovementStatusDashboard.css';

function ImprovementStatusDashboard() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<ImprovementIdeaStatistics | null>(null);
  const [ideas, setIdeas] = useState<ImprovementIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<ImprovementIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Available filter options
  const [departments, setDepartments] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas, statusFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build statistics filters
      const statsFilters: ImprovementIdeaStatisticsFilters = {};
      if (startDate) statsFilters.startDate = startDate;
      if (endDate) statsFilters.endDate = endDate;
      if (departmentFilter !== 'all') statsFilters.department = departmentFilter;
      if (categoryFilter !== 'all') statsFilters.category = categoryFilter;

      // Build ideas filters
      const ideasFilters: ImprovementIdeaFilters = { limit: 100 };
      if (departmentFilter !== 'all') ideasFilters.department = departmentFilter;
      if (categoryFilter !== 'all') ideasFilters.category = categoryFilter;

      const [statsData, ideasResponse] = await Promise.all([
        getImprovementIdeaStatistics(statsFilters),
        getImprovementIdeas(ideasFilters),
      ]);

      setStatistics(statsData);
      setIdeas(ideasResponse.data);

      // Extract unique departments and categories
      const uniqueDepts = new Set<string>();
      const uniqueCats = new Set<string>();
      ideasResponse.data.forEach(idea => {
        if (idea.department) uniqueDepts.add(idea.department);
        if (idea.category) uniqueCats.add(idea.category);
      });
      setDepartments(Array.from(uniqueDepts).sort());
      setCategories(Array.from(uniqueCats).sort());

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ideas];

    // Apply date filters
    if (startDate) {
      filtered = filtered.filter(idea => new Date(idea.submittedDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(idea => new Date(idea.submittedDate) <= new Date(endDate));
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(idea => idea.status === statusFilter);
    }

    setFilteredIdeas(filtered);
  };

  const handleFilterChange = () => {
    loadDashboardData();
  };

  const handleViewIdea = (ideaId: number | undefined) => {
    if (ideaId) {
      navigate(`/improvement-ideas/${ideaId}`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      submitted: 'status-submitted',
      under_review: 'status-under-review',
      approved: 'status-approved',
      rejected: 'status-rejected',
      in_progress: 'status-in-progress',
      implemented: 'status-implemented',
      closed: 'status-closed',
    };
    return statusMap[status] || 'status-submitted';
  };

  // Prepare chart data
  const statusChartData: DonutChartDataItem[] = statistics ? [
    { name: 'Submitted', value: statistics.submitted, color: '#fbc02d' },
    { name: 'Under Review', value: statistics.underReview, color: '#ff9800' },
    { name: 'Approved', value: statistics.approved, color: '#4caf50' },
    { name: 'In Progress', value: statistics.inProgress, color: '#2196f3' },
    { name: 'Implemented', value: statistics.implemented, color: '#388e3c' },
    { name: 'Rejected', value: statistics.rejected, color: '#f44336' },
    { name: 'Closed', value: statistics.closed, color: '#757575' },
  ].filter(item => item.value > 0) : [];

  const categoryChartData: BarChartDataItem[] = statistics && statistics.byCategory
    ? Object.entries(statistics.byCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  const departmentChartData: BarChartDataItem[] = statistics && statistics.byDepartment
    ? Object.entries(statistics.byDepartment)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  if (loading) {
    return <div className="page">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="page"><p className="error">{error}</p></div>;
  }

  return (
    <div className="improvement-status-dashboard">
      <div className="page-header">
        <h1>Improvement Ideas Status Dashboard</h1>
        <button className="btn-secondary" onClick={() => navigate('/improvement-ideas')}>
          View All Ideas
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="departmentFilter">Department:</label>
            <select
              id="departmentFilter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="categoryFilter">Category:</label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <button className="btn-primary" onClick={handleFilterChange}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-value">{statistics?.totalIdeas || 0}</div>
          <div className="stat-label">Total Ideas</div>
        </div>
        <div className="stat-card stat-submitted">
          <div className="stat-value">{statistics?.submitted || 0}</div>
          <div className="stat-label">Submitted</div>
        </div>
        <div className="stat-card stat-under-review">
          <div className="stat-value">{statistics?.underReview || 0}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div className="stat-card stat-approved">
          <div className="stat-value">{statistics?.approved || 0}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card stat-in-progress">
          <div className="stat-value">{statistics?.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card stat-implemented">
          <div className="stat-value">{statistics?.implemented || 0}</div>
          <div className="stat-label">Implemented</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Status Distribution</h3>
          {statusChartData.length > 0 ? (
            <DonutChart
              data={statusChartData}
              height={300}
              showLegend={true}
              showPercentage={true}
              ariaLabel="Status distribution chart"
            />
          ) : (
            <p className="no-data">No data available</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Top Categories</h3>
          {categoryChartData.length > 0 ? (
            <BarChart
              data={categoryChartData.map((item, index) => ({
                ...item,
                color: ['#2196f3', '#1976d2', '#0d47a1', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd', '#1565c0', '#0277bd'][index % 10]
              }))}
              height={300}
              yAxisLabel="Count"
              ariaLabel="Top categories chart"
            />
          ) : (
            <p className="no-data">No data available</p>
          )}
        </div>

        {departmentChartData.length > 0 && (
          <div className="chart-card">
            <h3>Top Departments</h3>
            <BarChart
              data={departmentChartData.map((item, index) => ({
                ...item,
                color: ['#4caf50', '#388e3c', '#2e7d32', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9', '#1b5e20', '#2e7d32'][index % 10]
              }))}
              height={300}
              yAxisLabel="Count"
              ariaLabel="Top departments chart"
            />
          </div>
        )}
      </div>

      {/* Recent Ideas Table */}
      <div className="ideas-section">
        <div className="section-header">
          <h3>
            {statusFilter === 'all' ? 'Recent Ideas' : `${getStatusDisplayName(statusFilter as ImprovementIdea['status'])} Ideas`}
          </h3>
          <div className="status-filter">
            <label htmlFor="statusFilter">Filter by Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="implemented">Implemented</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {filteredIdeas.length === 0 ? (
          <p className="no-data">No improvement ideas found with the current filters.</p>
        ) : (
          <div className="ideas-table-container">
            <table className="ideas-table">
              <thead>
                <tr>
                  <th>Idea Number</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIdeas.slice(0, 20).map((idea) => (
                  <tr key={idea.id}>
                    <td>{idea.ideaNumber}</td>
                    <td className="idea-title">{idea.title}</td>
                    <td>{idea.category}</td>
                    <td>{idea.department || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(idea.status)}`}>
                        {getStatusDisplayName(idea.status)}
                      </span>
                    </td>
                    <td>
                      {idea.submitterFirstName && idea.submitterLastName
                        ? `${idea.submitterFirstName} ${idea.submitterLastName}`
                        : '-'}
                    </td>
                    <td>{new Date(idea.submittedDate).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => handleViewIdea(idea.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIdeas.length > 20 && (
              <p className="table-note">
                Showing 20 of {filteredIdeas.length} ideas. Use filters to refine results.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImprovementStatusDashboard;
