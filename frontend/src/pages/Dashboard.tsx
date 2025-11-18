import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getAuditFindingsSummary } from '../services/auditFindingService';
import { getEquipmentMetrics, EquipmentMetrics } from '../services/equipmentService';
import { getNCRMetrics, NCRMetrics } from '../services/ncrService';
import MissingCompetencies from '../components/MissingCompetencies';
import { BarChart, LineChart, DonutChart } from '../components/charts';
import '../styles/Dashboard.css';
import '../styles/Charts.css';

interface Stats {
  totalDocuments: number;
  activeAudits: number;
  openNCRs: number;
  pendingCAPAs: number;
  equipmentCalibrationDue: number;
  upcomingTrainings: number;
}

interface AuditFindingsSummary {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byProcess: Record<string, number>;
  byStatus: Record<string, number>;
  overTime: Array<{ month: string; count: number }>;
}

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    activeAudits: 0,
    openNCRs: 0,
    pendingCAPAs: 0,
    equipmentCalibrationDue: 0,
    upcomingTrainings: 0,
  });
  const [equipmentMetrics, setEquipmentMetrics] = useState<EquipmentMetrics | null>(null);
  const [auditFindingsSummary, setAuditFindingsSummary] = useState<AuditFindingsSummary | null>(null);
  const [ncrMetrics, setNcrMetrics] = useState<NCRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });
  const [showCharts, setShowCharts] = useState(true);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (filters?: { startDate?: string; endDate?: string }) => {
    try {
      setLoading(true);
      // Fetch data from various endpoints
      const [documents, audits, equipment, equipMetrics, findingsSummary, ncrData] = await Promise.all([
        api.get('/documents'),
        api.get('/audits'),
        api.get('/equipment/calibration-due'),
        getEquipmentMetrics(30),
        getAuditFindingsSummary(filters),
        getNCRMetrics(filters),
      ]);
      
      setStats({
        totalDocuments: documents.data.length,
        activeAudits: audits.data.filter((a: any) => a.status === 'in_progress').length,
        openNCRs: ncrData.totalOpen + ncrData.totalInProgress,
        pendingCAPAs: 0, // Would fetch from CAPA endpoint
        equipmentCalibrationDue: equipment.data.length,
        upcomingTrainings: 0, // Would fetch from training endpoint
      });
      setEquipmentMetrics(equipMetrics);
      setAuditFindingsSummary(findingsSummary);
      setNcrMetrics(ncrData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    if (dateRange.startDate && dateRange.endDate) {
      loadDashboardData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }
  };

  const handleFilterClear = () => {
    setDateRange({ startDate: '', endDate: '' });
    loadDashboardData();
  };

  const handleRefreshData = () => {
    loadDashboardData(dateRange.startDate && dateRange.endDate ? dateRange : undefined);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>KPI Dashboard</h1>
        <div className="dashboard-actions">
          <button className="tw-btn tw-btn-secondary" onClick={() => setShowCharts(!showCharts)}>
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          <button className="tw-btn tw-btn-primary" onClick={handleRefreshData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="filter-section">
        <h3>Filter by Date Range</h3>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <button 
            className="tw-btn tw-btn-primary" 
            onClick={handleFilterApply}
            disabled={!dateRange.startDate || !dateRange.endDate}
          >
            Apply Filter
          </button>
          <button className="tw-btn tw-btn-secondary" onClick={handleFilterClear}>
            Clear Filter
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigate('/documents')}>
          <h3>Documents</h3>
          <div className="stat-value">{stats.totalDocuments}</div>
          <p>Total documents</p>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/audits')}>
          <h3>Audits</h3>
          <div className="stat-value">{stats.activeAudits}</div>
          <p>Active audits</p>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/ncr')}>
          <h3>NCRs</h3>
          <div className="stat-value">{stats.openNCRs}</div>
          <p>Open/In Progress NCRs</p>
        </div>

        <div className="stat-card">
          <h3>CAPAs</h3>
          <div className="stat-value">{stats.pendingCAPAs}</div>
          <p>Pending CAPAs</p>
        </div>

        <div className="stat-card warning clickable" onClick={() => navigate('/equipment')}>
          <h3>Equipment</h3>
          <div className="stat-value">{stats.equipmentCalibrationDue}</div>
          <p>Calibration due</p>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/training')}>
          <h3>Training</h3>
          <div className="stat-value">{stats.upcomingTrainings}</div>
          <p>Upcoming sessions</p>
        </div>
      </div>

      {/* NCR Metrics Section */}
      {ncrMetrics && (
        <div className="dashboard-section full-width">
          <div className="section-header">
            <h2>NCR Metrics Overview</h2>
            <button className="tw-btn-link" onClick={() => navigate('/ncr/dashboard')}>
              View Detailed Dashboard →
            </button>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Open</div>
              <div className="metric-value open">{ncrMetrics.totalOpen}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">In Progress</div>
              <div className="metric-value in-progress">{ncrMetrics.totalInProgress}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Resolved</div>
              <div className="metric-value resolved">{ncrMetrics.totalResolved}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Closed</div>
              <div className="metric-value closed">{ncrMetrics.totalClosed}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg. Closure Time</div>
              <div className="metric-value">{ncrMetrics.averageClosureTime} days</div>
            </div>
          </div>

          {showCharts && (
            <div className="charts-grid">
              <DonutChart
                data={ncrMetrics.bySeverity.map(item => ({
                  name: item.severity,
                  value: item.count,
                  color: item.severity === 'critical' ? '#dc3545' : 
                         item.severity === 'major' ? '#ffc107' : '#28a745'
                }))}
                title="NCR by Severity"
                height={300}
                showPercentage={true}
              />
              
              <BarChart
                data={ncrMetrics.byCategory.slice(0, 5).map(item => ({
                  name: item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category,
                  value: item.count,
                }))}
                title="Top 5 NCR Categories"
                height={300}
                yAxisLabel="Count"
              />

              <LineChart
                data={ncrMetrics.monthlyTrend.slice(-6).map(item => ({
                  name: item.month.substring(5),
                  count: item.count,
                }))}
                series={[
                  { dataKey: 'count', name: 'NCRs', color: '#007bff' }
                ]}
                title="NCR Monthly Trend (Last 6 Months)"
                height={300}
                yAxisLabel="Count"
              />
            </div>
          )}
        </div>
      )}

      {/* Equipment Metrics Section */}
      {equipmentMetrics && (
        <div className="dashboard-section full-width">
          <div className="section-header">
            <h2>Equipment Service Indicators</h2>
            <button className="tw-btn-link" onClick={() => navigate('/equipment')}>
              View Equipment List →
            </button>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Equipment</div>
              <div className="metric-value">{equipmentMetrics.total}</div>
            </div>
            <div className="metric-card danger">
              <div className="metric-label">Overdue Calibrations</div>
              <div className="metric-value">{equipmentMetrics.overdue.calibration}</div>
            </div>
            <div className="metric-card danger">
              <div className="metric-label">Overdue Maintenance</div>
              <div className="metric-value">{equipmentMetrics.overdue.maintenance}</div>
            </div>
            <div className="metric-card warning">
              <div className="metric-label">Upcoming (30 days)</div>
              <div className="metric-value">{equipmentMetrics.upcoming.total}</div>
              <div className="metric-detail">
                Cal: {equipmentMetrics.upcoming.calibration} | Maint: {equipmentMetrics.upcoming.maintenance}
              </div>
            </div>
          </div>

          {showCharts && equipmentMetrics.byStatus && (
            <div className="charts-grid">
              <DonutChart
                data={Object.entries(equipmentMetrics.byStatus).map(([status, count]) => ({
                  name: status.replace('_', ' ').toUpperCase(),
                  value: count,
                }))}
                title="Equipment by Status"
                height={300}
                showPercentage={true}
              />

              <BarChart
                data={[
                  { name: 'Overdue Cal', value: equipmentMetrics.overdue.calibration, color: '#dc3545' },
                  { name: 'Overdue Maint', value: equipmentMetrics.overdue.maintenance, color: '#dc3545' },
                  { name: 'Upcoming Cal', value: equipmentMetrics.upcoming.calibration, color: '#ffc107' },
                  { name: 'Upcoming Maint', value: equipmentMetrics.upcoming.maintenance, color: '#ffc107' },
                ]}
                title="Equipment Service Overview"
                height={300}
                yAxisLabel="Count"
              />
            </div>
          )}
        </div>
      )}

      {/* Audit Findings Section */}
      {auditFindingsSummary && (
        <div className="dashboard-section full-width">
          <div className="section-header">
            <h2>Audit Findings Overview</h2>
            <button className="tw-btn-link" onClick={() => navigate('/audit-findings')}>
              View All Findings →
            </button>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Findings</div>
              <div className="metric-value">{auditFindingsSummary.total}</div>
            </div>
            {Object.entries(auditFindingsSummary.bySeverity).slice(0, 3).map(([severity, count]) => (
              <div key={severity} className={`metric-card ${severity === 'critical' ? 'danger' : ''}`}>
                <div className="metric-label">{severity.charAt(0).toUpperCase() + severity.slice(1)}</div>
                <div className="metric-value">{count}</div>
              </div>
            ))}
          </div>

          {showCharts && (
            <div className="charts-grid">
              <DonutChart
                data={Object.entries(auditFindingsSummary.bySeverity).map(([severity, count]) => ({
                  name: severity.charAt(0).toUpperCase() + severity.slice(1),
                  value: count,
                  color: severity === 'critical' ? '#dc3545' : 
                         severity === 'major' ? '#ffc107' : 
                         severity === 'minor' ? '#17a2b8' : '#28a745'
                }))}
                title="Findings by Severity"
                height={300}
                showPercentage={true}
              />

              <BarChart
                data={Object.entries(auditFindingsSummary.byCategory).slice(0, 5).map(([category, count]) => ({
                  name: category.length > 15 ? category.substring(0, 15) + '...' : category,
                  value: count,
                }))}
                title="Top 5 Finding Categories"
                height={300}
                yAxisLabel="Count"
              />

              <BarChart
                data={Object.entries(auditFindingsSummary.byStatus).map(([status, count]) => ({
                  name: status.charAt(0).toUpperCase() + status.slice(1),
                  value: count,
                  color: status === 'open' ? '#dc3545' : 
                         status === 'resolved' ? '#28a745' : '#6c757d'
                }))}
                title="Findings by Status"
                height={300}
                yAxisLabel="Count"
              />

              {auditFindingsSummary.overTime && auditFindingsSummary.overTime.length > 0 && (
                <LineChart
                  data={auditFindingsSummary.overTime.slice(-6).map(item => ({
                    name: item.month.substring(5),
                    count: item.count,
                  }))}
                  series={[
                    { dataKey: 'count', name: 'Findings', color: '#007bff' }
                  ]}
                  title="Findings Trend (Last 6 Months)"
                  height={300}
                  yAxisLabel="Count"
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>My Training Compliance</h2>
          {currentUser && <MissingCompetencies userId={currentUser.id} daysThreshold={30} />}
        </div>

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <p>No recent activity</p>
        </div>

        <div className="dashboard-section">
          <h2>Alerts & Notifications</h2>
          {stats.equipmentCalibrationDue > 0 && (
            <div className="alert">
              {stats.equipmentCalibrationDue} equipment item(s) require calibration
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
