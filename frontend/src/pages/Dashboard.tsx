import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/Dashboard.css';

interface Stats {
  totalDocuments: number;
  activeAudits: number;
  openNCRs: number;
  pendingCAPAs: number;
  equipmentCalibrationDue: number;
  upcomingTrainings: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch data from various endpoints
      const [documents, audits, equipment] = await Promise.all([
        api.get('/documents'),
        api.get('/audits'),
        api.get('/equipment/calibration-due'),
      ]);

      setStats({
        totalDocuments: documents.data.length,
        activeAudits: audits.data.filter((a: any) => a.status === 'in_progress').length,
        openNCRs: 0, // Would fetch from NCR endpoint
        pendingCAPAs: 0, // Would fetch from CAPA endpoint
        equipmentCalibrationDue: equipment.data.length,
        upcomingTrainings: 0, // Would fetch from training endpoint
      });
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

      <div className="dashboard-sections">
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
