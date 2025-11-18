import { useEffect, useState } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import { getAuditFindingsSummary } from '../services/auditFindingService';
import MissingCompetencies from '../components/MissingCompetencies';
import '../styles/Dashboard.css';

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
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    activeAudits: 0,
    openNCRs: 0,
    pendingCAPAs: 0,
    equipmentCalibrationDue: 0,
    upcomingTrainings: 0,
  });
  const [auditFindingsSummary, setAuditFindingsSummary] = useState<AuditFindingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch data from various endpoints
      const [documents, audits, equipment, findingsSummary] = await Promise.all([
        api.get('/documents'),
        api.get('/audits'),
        api.get('/equipment/calibration-due'),
        getAuditFindingsSummary(),
      ]);

      setStats({
        totalDocuments: documents.data.length,
        activeAudits: audits.data.filter((a: any) => a.status === 'in_progress').length,
        openNCRs: 0, // Would fetch from NCR endpoint
        pendingCAPAs: 0, // Would fetch from CAPA endpoint
        equipmentCalibrationDue: equipment.data.length,
        upcomingTrainings: 0, // Would fetch from training endpoint
      });
      setAuditFindingsSummary(findingsSummary);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Documents</h3>
          <div className="stat-value">{stats.totalDocuments}</div>
          <p>Total documents</p>
        </div>

        <div className="stat-card">
          <h3>Audits</h3>
          <div className="stat-value">{stats.activeAudits}</div>
          <p>Active audits</p>
        </div>

        <div className="stat-card">
          <h3>NCRs</h3>
          <div className="stat-value">{stats.openNCRs}</div>
          <p>Open NCRs</p>
        </div>

        <div className="stat-card">
          <h3>CAPAs</h3>
          <div className="stat-value">{stats.pendingCAPAs}</div>
          <p>Pending CAPAs</p>
        </div>

        <div className="stat-card warning">
          <h3>Equipment</h3>
          <div className="stat-value">{stats.equipmentCalibrationDue}</div>
          <p>Calibration due</p>
        </div>

        <div className="stat-card">
          <h3>Training</h3>
          <div className="stat-value">{stats.upcomingTrainings}</div>
          <p>Upcoming sessions</p>
        </div>
      </div>

      {auditFindingsSummary && (
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Audit Findings Overview</h2>
            <div className="findings-summary">
              <div className="summary-item">
                <strong>Total Findings:</strong> {auditFindingsSummary.total}
              </div>
              
              <div className="summary-group">
                <h3>By Severity</h3>
                <div className="summary-list">
                  {Object.entries(auditFindingsSummary.bySeverity).map(([severity, count]) => (
                    <div key={severity} className={`summary-item severity-${severity}`}>
                      <span className="label">{severity}:</span>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-group">
                <h3>By Category</h3>
                <div className="summary-list">
                  {Object.entries(auditFindingsSummary.byCategory).map(([category, count]) => (
                    <div key={category} className="summary-item">
                      <span className="label">{category}:</span>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-group">
                <h3>By Status</h3>
                <div className="summary-list">
                  {Object.entries(auditFindingsSummary.byStatus).map(([status, count]) => (
                    <div key={status} className="summary-item">
                      <span className="label">{status}:</span>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
