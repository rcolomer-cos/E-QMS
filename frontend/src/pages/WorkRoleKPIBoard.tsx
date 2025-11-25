import { useState, useEffect } from 'react';
import { getWorkRoleKPIs, WorkRoleKPI } from '../services/workRoleKpiService';
import '../styles/WorkRoleKPIBoard.css';

function WorkRoleKPIBoard() {
  const [kpis, setKpis] = useState<WorkRoleKPI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkRoleKPIs();
      setKpis(data);
    } catch (err) {
      setError('Failed to load work role KPI statistics');
      console.error('Error fetching KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (level: number): string => {
    if (level >= 4.5) return '#4caf50'; // Green - Expert
    if (level >= 3.5) return '#2196f3'; // Blue - Advanced
    if (level >= 2.5) return '#ff9800'; // Orange - Intermediate
    if (level >= 1.5) return '#ffc107'; // Yellow - Beginner
    return '#9e9e9e'; // Gray - No data
  };

  const getSkillLevelLabel = (level: number): string => {
    if (level >= 4.5) return 'Expert';
    if (level >= 3.5) return 'Advanced';
    if (level >= 2.5) return 'Intermediate';
    if (level >= 1.5) return 'Beginner';
    if (level > 0) return 'Novice';
    return 'Not Assessed';
  };

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      Management: '#673ab7',
      Technical: '#2196f3',
      Administrative: '#009688',
      Quality: '#f44336',
      Production: '#ff9800',
      Engineering: '#795548',
      Safety: '#4caf50',
    };
    return category ? colors[category] || '#607d8b' : '#607d8b';
  };

  const totalEmployees = kpis.reduce((sum, kpi) => sum + kpi.employeeCount, 0);
  const avgExperience = totalEmployees > 0
    ? kpis.reduce((sum, kpi) => sum + kpi.avgWorkExperienceYears * kpi.employeeCount, 0) / totalEmployees
    : 0;
  const avgSkillLevel = totalEmployees > 0
    ? kpis.reduce((sum, kpi) => sum + kpi.avgSkillLevel * kpi.employeeCount, 0) / totalEmployees
    : 0;

  if (loading) {
    return (
      <div className="work-role-kpi-board">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading KPI data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="work-role-kpi-board">
        <div className="error-container">
          <div className="error-message">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="work-role-kpi-board">
      <div className="kpi-board-header">
        <h1>
          <span className="icon">💼</span> Work Role KPI Dashboard
        </h1>
        <p className="subtitle">
          Overview of work roles with employee statistics, experience levels, and skill assessments
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="summary-cards">
        <div className="summary-card card-blue">
          <div className="summary-content">
            <div className="summary-info">
              <h2>{kpis.length}</h2>
              <p>Total Roles</p>
            </div>
            <div className="summary-icon">💼</div>
          </div>
        </div>

        <div className="summary-card card-purple">
          <div className="summary-content">
            <div className="summary-info">
              <h2>{totalEmployees}</h2>
              <p>Total Employees</p>
            </div>
            <div className="summary-icon">👥</div>
          </div>
        </div>

        <div className="summary-card card-orange">
          <div className="summary-content">
            <div className="summary-info">
              <h2>{avgExperience > 0 ? avgExperience.toFixed(1) : '0.0'}</h2>
              <p>Avg. Experience (Years)</p>
            </div>
            <div className="summary-icon">📈</div>
          </div>
        </div>

        <div className="summary-card card-green">
          <div className="summary-content">
            <div className="summary-info">
              <h2>{avgSkillLevel > 0 ? avgSkillLevel.toFixed(1) : '0.0'}</h2>
              <p>Avg. Skill Level</p>
            </div>
            <div className="summary-icon">⭐</div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Work Role Cards */}
      <div className="kpi-cards-grid">
        {kpis.length === 0 ? (
          <div className="no-data-message">
            <p>ℹ️ No work role data available.</p>
          </div>
        ) : (
          kpis.map((kpi) => (
            <div key={kpi.id} className="kpi-card">
              <div className="kpi-card-header">
                <h3>{kpi.name}</h3>
                {kpi.code && <span className="role-code">{kpi.code}</span>}
              </div>

              <div className="kpi-card-tags">
                {kpi.category && (
                  <span
                    className="tag category-tag"
                    style={{ backgroundColor: getCategoryColor(kpi.category), color: 'white' }}
                  >
                    {kpi.category}
                  </span>
                )}
                {kpi.level && <span className="tag level-tag">{kpi.level}</span>}
              </div>

              {kpi.departmentName && (
                <p className="department">📍 {kpi.departmentName}</p>
              )}

              <hr className="card-divider" />

              <div className="kpi-metrics">
                <div className="metric-row">
                  <div className="metric-label">
                    <span className="metric-icon">👥</span>
                    <span>Employees</span>
                  </div>
                  <div className="metric-value">{kpi.employeeCount}</div>
                </div>

                <div className="metric-row">
                  <div className="metric-label">
                    <span className="metric-icon">📈</span>
                    <span>Avg. Experience</span>
                  </div>
                  <div className="metric-value">
                    {kpi.avgWorkExperienceYears > 0
                      ? `${kpi.avgWorkExperienceYears.toFixed(1)} yrs`
                      : 'N/A'}
                  </div>
                </div>

                <div className="metric-row">
                  <div className="metric-label">
                    <span className="metric-icon">⭐</span>
                    <span>Avg. Skill Level</span>
                  </div>
                  <div className="metric-value">
                    {kpi.avgSkillLevel > 0 ? (
                      <>
                        <span className="skill-value">
                          {kpi.avgSkillLevel.toFixed(1)}
                        </span>
                        <span
                          className="skill-badge"
                          style={{
                            backgroundColor: getSkillLevelColor(kpi.avgSkillLevel),
                            color: 'white',
                          }}
                        >
                          {getSkillLevelLabel(kpi.avgSkillLevel)}
                        </span>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkRoleKPIBoard;
