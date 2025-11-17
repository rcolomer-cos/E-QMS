import { useEffect, useState, useMemo } from 'react';
import {
  getTrainingMatrix,
  TrainingMatrixEntry,
  TrainingMatrixFilters,
} from '../services/trainingMatrixService';
import '../styles/TrainingMatrix.css';

interface MatrixUser {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
}

interface MatrixCompetency {
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  competencyCategory: string;
}

interface MatrixCell {
  displayStatus: 'active' | 'missing' | 'expired' | 'expiring_soon';
  effectiveDate: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  proficiencyLevel: string | null;
  assessmentScore: number | null;
  isMandatory: boolean | null;
  isRegulatory: boolean | null;
  priority: string | null;
}

function TrainingMatrix() {
  const [matrixData, setMatrixData] = useState<TrainingMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TrainingMatrixFilters>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadMatrixData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadMatrixData = async () => {
    try {
      setLoading(true);
      const response = await getTrainingMatrix(filters);
      setMatrixData(response.data);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(response.data.map((entry) => entry.competencyCategory))
      ).sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load training matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform flat data into matrix structure
  const { users, competencies, matrix } = useMemo(() => {
    const usersMap = new Map<number, MatrixUser>();
    const competenciesMap = new Map<number, MatrixCompetency>();
    const matrixMap = new Map<string, MatrixCell>();

    matrixData.forEach((entry) => {
      // Collect unique users
      if (!usersMap.has(entry.userId)) {
        usersMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          userDepartment: entry.userDepartment,
        });
      }

      // Collect unique competencies
      if (!competenciesMap.has(entry.competencyId)) {
        competenciesMap.set(entry.competencyId, {
          competencyId: entry.competencyId,
          competencyCode: entry.competencyCode,
          competencyName: entry.competencyName,
          competencyCategory: entry.competencyCategory,
        });
      }

      // Build matrix cells
      const key = `${entry.userId}-${entry.competencyId}`;
      matrixMap.set(key, {
        displayStatus: entry.displayStatus,
        effectiveDate: entry.effectiveDate,
        expiryDate: entry.expiryDate,
        daysUntilExpiry: entry.daysUntilExpiry,
        proficiencyLevel: entry.proficiencyLevel,
        assessmentScore: entry.assessmentScore,
        isMandatory: entry.isMandatory,
        isRegulatory: entry.isRegulatory,
        priority: entry.priority,
      });
    });

    return {
      users: Array.from(usersMap.values()),
      competencies: Array.from(competenciesMap.values()),
      matrix: matrixMap,
    };
  }, [matrixData]);

  const getCellClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'cell-active';
      case 'expired':
        return 'cell-expired';
      case 'expiring_soon':
        return 'cell-expiring';
      case 'missing':
        return 'cell-missing';
      default:
        return 'cell-unknown';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return '✓';
      case 'expired':
        return '✗';
      case 'expiring_soon':
        return '⚠';
      case 'missing':
        return '−';
      default:
        return '?';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getCellTooltip = (cell: MatrixCell): string => {
    const lines: string[] = [];
    
    lines.push(`Status: ${cell.displayStatus}`);
    
    if (cell.isMandatory) {
      lines.push('Mandatory: Yes');
    }
    
    if (cell.isRegulatory) {
      lines.push('Regulatory: Yes');
    }
    
    if (cell.priority) {
      lines.push(`Priority: ${cell.priority}`);
    }
    
    if (cell.effectiveDate) {
      lines.push(`Effective: ${formatDate(cell.effectiveDate)}`);
    }
    
    if (cell.expiryDate) {
      lines.push(`Expires: ${formatDate(cell.expiryDate)}`);
    }
    
    if (cell.daysUntilExpiry !== null) {
      lines.push(`Days until expiry: ${cell.daysUntilExpiry}`);
    }
    
    if (cell.proficiencyLevel) {
      lines.push(`Proficiency: ${cell.proficiencyLevel}`);
    }
    
    if (cell.assessmentScore !== null) {
      lines.push(`Score: ${cell.assessmentScore}`);
    }
    
    return lines.join('\n');
  };

  if (loading) {
    return <div className="loading">Loading training matrix...</div>;
  }

  return (
    <div className="training-matrix-page">
      <div className="page-header">
        <h1>Training Matrix</h1>
        <button className="btn-primary" onClick={loadMatrixData}>
          Refresh
        </button>
      </div>

      <div className="filters">
        <select
          value={filters.competencyCategory || ''}
          onChange={(e) =>
            setFilters({ ...filters, competencyCategory: e.target.value || undefined })
          }
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="legend">
        <h3>Status Legend:</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-indicator cell-active">{getStatusLabel('active')}</span>
            <span>Active/Completed</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator cell-expiring">{getStatusLabel('expiring_soon')}</span>
            <span>Expiring Soon (≤30 days)</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator cell-expired">{getStatusLabel('expired')}</span>
            <span>Expired</span>
          </div>
          <div className="legend-item">
            <span className="legend-indicator cell-missing">{getStatusLabel('missing')}</span>
            <span>Missing</span>
          </div>
        </div>
      </div>

      {users.length === 0 || competencies.length === 0 ? (
        <div className="empty-message">No training data available</div>
      ) : (
        <div className="matrix-container">
          <table className="training-matrix">
            <thead>
              <tr>
                <th className="fixed-column user-column">User</th>
                {competencies.map((comp) => (
                  <th key={comp.competencyId} className="competency-header">
                    <div className="competency-header-content">
                      <div className="competency-code">{comp.competencyCode}</div>
                      <div className="competency-name">{comp.competencyName}</div>
                      <div className="competency-category">{comp.competencyCategory}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td className="fixed-column user-cell">
                    <div className="user-info">
                      <div className="user-name">{user.userName}</div>
                      <div className="user-details">
                        <span className="user-role">{user.userRole}</span>
                        {user.userDepartment && (
                          <>
                            <span className="separator">•</span>
                            <span className="user-department">{user.userDepartment}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  {competencies.map((comp) => {
                    const key = `${user.userId}-${comp.competencyId}`;
                    const cell = matrix.get(key);
                    
                    if (!cell) {
                      return (
                        <td key={key} className="matrix-cell cell-unknown">
                          ?
                        </td>
                      );
                    }

                    return (
                      <td
                        key={key}
                        className={`matrix-cell ${getCellClass(cell.displayStatus)}`}
                        title={getCellTooltip(cell)}
                      >
                        <span className="status-indicator">
                          {getStatusLabel(cell.displayStatus)}
                        </span>
                        {cell.isMandatory && (
                          <span className="mandatory-badge" title="Mandatory">
                            M
                          </span>
                        )}
                        {cell.isRegulatory && (
                          <span className="regulatory-badge" title="Regulatory">
                            R
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="matrix-summary">
        <p>
          Showing {users.length} user(s) × {competencies.length} competenc(ies) = {users.length * competencies.length} cell(s)
        </p>
      </div>
    </div>
  );
}

export default TrainingMatrix;
