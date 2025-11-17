import { useEffect, useState } from 'react';
import {
  getMissingCompetenciesForUser,
  MissingCompetency,
} from '../services/roleTrainingRequirementsService';
import '../styles/MissingCompetencies.css';

interface MissingCompetenciesProps {
  userId: number;
  daysThreshold?: number;
}

const MissingCompetencies: React.FC<MissingCompetenciesProps> = ({
  userId,
  daysThreshold = 30,
}) => {
  const [missingCompetencies, setMissingCompetencies] = useState<MissingCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissingCompetencies = async () => {
      try {
        setLoading(true);
        const response = await getMissingCompetenciesForUser(userId, daysThreshold);
        setMissingCompetencies(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching missing competencies:', err);
        setError('Failed to load missing competencies');
      } finally {
        setLoading(false);
      }
    };

    fetchMissingCompetencies();
  }, [userId, daysThreshold]);

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'missing':
        return 'badge badge-danger';
      case 'expired':
        return 'badge badge-error';
      case 'expiring_soon':
        return 'badge badge-warning';
      default:
        return 'badge badge-info';
    }
  };

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'badge badge-critical';
      case 'high':
        return 'badge badge-high';
      case 'normal':
        return 'badge badge-normal';
      case 'low':
        return 'badge badge-low';
      default:
        return 'badge badge-info';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'missing':
        return 'Missing';
      case 'expired':
        return 'Expired';
      case 'expiring_soon':
        return 'Expiring Soon';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="loading">Loading missing competencies...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (missingCompetencies.length === 0) {
    return (
      <div className="missing-competencies-empty">
        <p>✓ All required competencies are up to date!</p>
      </div>
    );
  }

  return (
    <div className="missing-competencies">
      <h3>Missing or Outdated Competencies</h3>
      <p className="threshold-info">
        Showing competencies that are missing, expired, or expiring within {daysThreshold} days.
      </p>
      
      <div className="competencies-list">
        {missingCompetencies.map((competency, index) => (
          <div key={index} className="competency-card">
            <div className="competency-header">
              <div className="competency-title">
                <h4>{competency.competencyName}</h4>
                <span className="competency-code">{competency.competencyCode}</span>
              </div>
              <div className="competency-badges">
                <span className={getStatusBadgeClass(competency.status)}>
                  {getStatusLabel(competency.status)}
                </span>
                <span className={getPriorityBadgeClass(competency.priority)}>
                  {competency.priority.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="competency-body">
              <div className="competency-detail">
                <strong>Role:</strong> {competency.roleName}
              </div>
              <div className="competency-detail">
                <strong>Category:</strong> {competency.competencyCategory}
              </div>
              
              {competency.isMandatory && (
                <div className="competency-detail mandatory">
                  <strong>Mandatory:</strong> Yes
                </div>
              )}
              
              {competency.isRegulatory && (
                <div className="competency-detail regulatory">
                  <strong>Regulatory:</strong> Yes
                </div>
              )}
              
              {competency.gracePeriodDays !== null && competency.gracePeriodDays !== undefined && (
                <div className="competency-detail">
                  <strong>Grace Period:</strong> {competency.gracePeriodDays} days
                </div>
              )}
              
              {competency.daysUntilExpiry !== null && competency.daysUntilExpiry !== undefined && (
                <div className="competency-detail expiry-warning">
                  <strong>Days Until Expiry:</strong> {competency.daysUntilExpiry}
                </div>
              )}
              
              {competency.complianceDeadline && (
                <div className="competency-detail deadline">
                  <strong>Compliance Deadline:</strong>{' '}
                  {new Date(competency.complianceDeadline).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissingCompetencies;
