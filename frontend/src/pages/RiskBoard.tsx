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
import { useTranslation } from 'react-i18next';

type ViewMode = 'matrix' | 'cards';

function RiskBoard() {
  const { t } = useTranslation();
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
    return <div className="loading">{t('riskBoard.loading')}</div>;
  }

  return (
    <div className="risk-board-container">
      <div className="risk-board-header">
        <div className="header-left">
          <h1>{t('riskBoard.title')}</h1>
          <button onClick={() => navigate('/risks')} className="btn-back">
            ← {t('riskBoard.backToRisksList')}
          </button>
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'matrix' ? 'active' : ''}
            onClick={() => setViewMode('matrix')}
          >
            {t('riskBoard.matrixView')}
          </button>
          <button
            className={viewMode === 'cards' ? 'active' : ''}
            onClick={() => setViewMode('cards')}
          >
            {t('riskBoard.cardView')}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Summary */}
      {statistics && (
        <div className="risk-board-stats">
          <div className="stat-item">
            <span className="stat-label">{t('riskManagement.totalRisks')}:</span>
            <span className="stat-value">{statistics.totalRisks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('riskManagement.critical')}:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('critical') }}>
              {statistics.byLevel.critical || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('riskManagement.high')}:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('high') }}>
              {statistics.byLevel.high || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('riskManagement.medium')}:</span>
            <span className="stat-value" style={{ color: getRiskLevelColor('medium') }}>
              {statistics.byLevel.medium || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('riskManagement.low')}:</span>
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
          <option value="">{t('riskManagement.allStatuses')}</option>
          <option value="identified">{t('riskManagement.status.identified')}</option>
          <option value="assessed">{t('riskManagement.status.assessed')}</option>
          <option value="mitigating">{t('riskManagement.status.mitigating')}</option>
          <option value="monitoring">{t('riskManagement.status.monitoring')}</option>
          <option value="closed">{t('riskManagement.status.closed')}</option>
          <option value="accepted">{t('riskManagement.status.accepted')}</option>
        </select>

        <select
          value={filters.category || ''}
          onChange={e => handleFilterChange('category', e.target.value)}
        >
          <option value="">{t('riskBoard.allCategories')}</option>
          {statistics && Object.keys(statistics.byCategory).map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={t('riskBoard.filterByDepartment')}
          value={filters.department || ''}
          onChange={e => handleFilterChange('department', e.target.value)}
        />

        <button onClick={() => setFilters({ limit: 100 })} className="btn-clear-filters">
          {t('riskBoard.clearFilters')}
        </button>
      </div>

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="risk-matrix-container">
          <div className="matrix-legend">
            <h3>{t('riskBoard.riskMatrix')}</h3>
            <p>{t('riskBoard.matrixExplanation')}</p>
          </div>
          
          <div className="risk-matrix">
            {/* Impact axis label */}
            <div className="axis-label axis-label-vertical">
              <span>{t('riskManagement.impact')}</span>
            </div>

            {/* Matrix grid */}
            <div className="matrix-grid">
              {/* Column headers (Likelihood) */}
              <div className="matrix-corner"></div>
              <div className="matrix-header">1<br/>{t('riskBoard.veryLow')}</div>
              <div className="matrix-header">2<br/>{t('riskManagement.low')}</div>
              <div className="matrix-header">3<br/>{t('riskManagement.medium')}</div>
              <div className="matrix-header">4<br/>{t('riskManagement.high')}</div>
              <div className="matrix-header">5<br/>{t('riskBoard.veryHigh')}</div>

              {/* Rows (Impact from high to low) */}
              {[5, 4, 3, 2, 1].map(impact => (
                <>
                  <div key={`row-header-${impact}`} className="matrix-row-header">
                    {impact}<br/>
                    {impact === 5 ? t('riskBoard.catastrophic') : impact === 4 ? t('riskBoard.major') : impact === 3 ? t('riskBoard.moderate') : impact === 2 ? t('riskBoard.minor') : t('riskBoard.negligible')}
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
                              +{filteredCellRisks.length - 3} {t('riskBoard.more')}
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
              <span>{t('riskManagement.likelihood')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="risk-cards-container">
          {filteredRisks.length === 0 ? (
            <p className="no-risks-message">{t('riskBoard.noRisksMatchFilters')}</p>
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
                      <span className="label">{t('riskManagement.category')}:</span>
                      <span className="value">{risk.category}</span>
                    </div>
                    <div className="risk-card-row">
                      <span className="label">{t('riskManagement.riskScore')}:</span>
                      <span className="value">{risk.riskScore} (L:{risk.likelihood} × I:{risk.impact})</span>
                    </div>
                    <div className="risk-card-row">
                      <span className="label">{t('common.status')}:</span>
                      <span
                        className="value status-badge"
                        style={{ backgroundColor: getStatusColor(risk.status) }}
                      >
                        {risk.status}
                      </span>
                    </div>
                    {risk.department && (
                      <div className="risk-card-row">
                        <span className="label">{t('riskManagement.department')}:</span>
                        <span className="value">{risk.department}</span>
                      </div>
                    )}
                  </div>

                  {risk.mitigationStrategy && (
                    <div className="risk-card-mitigation">
                      <div className="mitigation-label">{t('riskBoard.mitigation')}:</div>
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
        <h3>{t('riskBoard.legend')}</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('critical') }}></div>
            <span>{t('riskManagement.critical')} (20-25)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('high') }}></div>
            <span>{t('riskManagement.high')} (12-19)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('medium') }}></div>
            <span>{t('riskManagement.medium')} (6-11)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: getRiskLevelColor('low') }}></div>
            <span>{t('riskManagement.low')} (1-5)</span>
          </div>
        </div>
        <div className="legend-status">
          <h4>{t('riskBoard.statusColors')}:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('closed') }}></div>
              <span>{t('riskManagement.status.closed')}</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('monitoring') }}></div>
              <span>{t('riskManagement.status.monitoring')}</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('mitigating') }}></div>
              <span>{t('riskManagement.status.mitigating')}</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: getStatusColor('identified') }}></div>
              <span>{t('riskBoard.identifiedAssessed')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskBoard;
