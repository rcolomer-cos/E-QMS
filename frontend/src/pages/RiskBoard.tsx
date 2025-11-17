import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRisks,
  getRiskStatistics,
  RiskFilters,
  getRiskLevelColor,
} from '../services/riskService';
import { Risk, RiskStatistics } from '../types';
import '../styles/RiskBoard.css';

type ViewMode = 'matrix' | 'cards';

function RiskBoard() {
  const navigate = useNavigate();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [statistics, setStatistics] = useState<RiskStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [filters, setFilters] = useState<RiskFilters>({
    limit: 100, // Get more risks for visualization
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskData, statsData] = await Promise.all([
        getRisks(filters),
        getRiskStatistics(),
      ]);
      setRisks(riskData.data);
      setStatistics(statsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof RiskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleRiskClick = (riskId: number) => {
    navigate(`/risks/${riskId}`);
  };

  // Group risks by likelihood and impact for matrix view
  const getRisksForCell = (likelihood: number, impact: number): Risk[] => {
    return risks.filter(r => r.likelihood === likelihood && r.impact === impact);
  };

  // Get the risk level for a cell based on score
  const getCellRiskLevel = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    if (score >= 20) return 'critical';
    if (score >= 12) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  };

  // Get status badge color
  const getStatusColor = (status: Risk['status']): string => {
    switch (status) {
      case 'closed':
        return '#388e3c'; // Green
      case 'monitoring':
        return '#2196f3'; // Blue
      case 'mitigating':
        return '#f57c00'; // Orange
      case 'identified':
      case 'assessed':
        return '#fbc02d'; // Yellow
      case 'accepted':
        return '#757575'; // Grey
      default:
        return '#757575';
    }
  };

  // Filter risks by selected filters
  const filteredRisks = risks.filter(risk => {
    if (filters.status && risk.status !== filters.status) return false;
    if (filters.category && risk.category !== filters.category) return false;
    if (filters.department && risk.department !== filters.department) return false;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading risk board...</div>;
  }

  return (
    <div className="risk-board-container">
      <div className="risk-board-header">
        <div className="header-left">
          <h1>Risk Board</h1>
          <button onClick={() => navigate('/risks')} className="btn-back">
            ← Back to Risks List
          </button>
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'matrix' ? 'active' : ''}
            onClick={() => setViewMode('matrix')}
          >
            Matrix View
          </button>
          <button
            className={viewMode === 'cards' ? 'active' : ''}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Summary */}
      {statistics && (
        <div className="risk-board-stats">
          <div className="stat-item">
            <span className="stat-label">Total Risks:</span>
            <span className="stat-value">{statistics.totalRisks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Critical:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('critical') }}>
              {statistics.byLevel.critical || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">High:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('high') }}>
              {statistics.byLevel.high || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Medium:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('medium') }}>
              {statistics.byLevel.medium || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Low:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('low') }}>
              {statistics.byLevel.low || 0}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="risk-board-filters">
        <select
          value={filters.status || ''}
          onChange={e => handleFilterChange('status', e.target.value)}
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
          value={filters.category || ''}
          onChange={e => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {statistics && Object.keys(statistics.byCategory).map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by department..."
          value={filters.department || ''}
          onChange={e => handleFilterChange('department', e.target.value)}
        />

        <button onClick={() => setFilters({ limit: 100 })} className="btn-clear-filters">
          Clear Filters
        </button>
      </div>

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="risk-matrix-container">
          <div className="matrix-legend">
            <h3>Risk Matrix</h3>
            <p>Likelihood (horizontal) × Impact (vertical) = Risk Level</p>
          </div>
          
          <div className="risk-matrix">
            {/* Impact axis label */}
            <div className="axis-label axis-label-vertical">
              <span>Impact</span>
            </div>

            {/* Matrix grid */}
            <div className="matrix-grid">
              {/* Column headers (Likelihood) */}
              <div className="matrix-corner"></div>
              <div className="matrix-header">1<br/>Very Low</div>
              <div className="matrix-header">2<br/>Low</div>
              <div className="matrix-header">3<br/>Medium</div>
              <div className="matrix-header">4<br/>High</div>
              <div className="matrix-header">5<br/>Very High</div>

              {/* Rows (Impact from high to low) */}
              {[5, 4, 3, 2, 1].map(impact => (
                <>
                  <div key={`row-header-${impact}`} className="matrix-row-header">
                    {impact}<br/>
                    {impact === 5 ? 'Catastrophic' : impact === 4 ? 'Major' : impact === 3 ? 'Moderate' : impact === 2 ? 'Minor' : 'Negligible'}
                  </div>
                  {[1, 2, 3, 4, 5].map(likelihood => {
                    const cellRisks = getRisksForCell(likelihood, impact);
                    const riskLevel = getCellRiskLevel(likelihood, impact);
                    const filteredCellRisks = cellRisks.filter(risk => 
                      filteredRisks.some(fr => fr.id === risk.id)
                    );

                    return (
                      <div
                        key={`cell-${likelihood}-${impact}`}
                        className={`matrix-cell risk-level-${riskLevel}`}
                        style={{
                          backgroundColor: `${getRiskLevelColor(riskLevel)}15`,
                          borderColor: getRiskLevelColor(riskLevel),
                        }}
                      >
                        <div className="cell-score">{likelihood * impact}</div>
                        <div className="cell-risks">
                          {filteredCellRisks.length > 0 && (
                            <div className="risk-count-badge">
                              {filteredCellRisks.length}
                            </div>
                          )}
                          {filteredCellRisks.slice(0, 3).map(risk => (
                            <div
                              key={risk.id}
                              className="risk-item-mini"
                              onClick={() => handleRiskClick(risk.id)}
                              title={`${risk.riskNumber}: ${risk.title}`}
                            >
                              <div className="risk-mini-number">{risk.riskNumber}</div>
                              <div
                                className="risk-mini-status"
                                style={{ backgroundColor: getStatusColor(risk.status) }}
                              />
                            </div>
                          ))}
                          {filteredCellRisks.length > 3 && (
                            <div className="risk-more-indicator">
                              +{filteredCellRisks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            {/* Likelihood axis label */}
            <div className="axis-label axis-label-horizontal">
              <span>Likelihood</span>
            </div>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="risk-cards-container">
          {filteredRisks.length === 0 ? (
            <p className="no-risks-message">No risks match the selected filters.</p>
          ) : (
            <div className="risk-cards-grid">
              {filteredRisks.map(risk => (
                <div
                  key={risk.id}
                  className="risk-card"
                  onClick={() => handleRiskClick(risk.id)}
                  style={{
                    borderLeftColor: getRiskLevelColor(risk.riskLevel),
                  }}
                >
                  <div className="risk-card-header">
                    <div className="risk-card-number">{risk.riskNumber}</div>
                    <div
                      className="risk-card-level"
                      style={{
                        backgroundColor: getRiskLevelColor(risk.riskLevel),
                      }}
                    >
                      {risk.riskLevel?.toUpperCase()}
                    </div>
                  </div>
                  
                  <h3 className="risk-card-title">{risk.title}</h3>
                  
                  <div className="risk-card-details">
                    <div className="risk-card-row">
                      <span className="label">Category:</span>
                      <span className="value">{risk.category}</span>
                    </div>
                    <div className="risk-card-row">
                      <span className="label">Risk Score:</span>
                      <span className="value">{risk.riskScore} (L:{risk.likelihood} × I:{risk.impact})</span>
                    </div>
                    <div className="risk-card-row">
                      <span className="label">Status:</span>
                      <span
                        className="value status-badge"
                        style={{ backgroundColor: getStatusColor(risk.status) }}
                      >
                        {risk.status}
                      </span>
                    </div>
                    {risk.department && (
                      <div className="risk-card-row">
                        <span className="label">Department:</span>
                        <span className="value">{risk.department}</span>
                      </div>
                    )}
                  </div>

                  {risk.mitigationStrategy && (
                    <div className="risk-card-mitigation">
                      <div className="mitigation-label">Mitigation:</div>
                      <div className="mitigation-text">
                        {risk.mitigationStrategy.substring(0, 100)}
                        {risk.mitigationStrategy.length > 100 ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="risk-board-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('critical') }}></div>
            <span>Critical (20-25)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('high') }}></div>
            <span>High (12-19)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('medium') }}></div>
            <span>Medium (6-11)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('low') }}></div>
            <span>Low (1-5)</span>
          </div>
        </div>
        <div className="legend-status">
          <h4>Status Colors:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('closed') }}></div>
              <span>Closed</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('monitoring') }}></div>
              <span>Monitoring</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('mitigating') }}></div>
              <span>Mitigating</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('identified') }}></div>
              <span>Identified/Assessed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskBoard;
