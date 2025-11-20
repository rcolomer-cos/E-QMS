import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getRiskById,
  updateRisk,
  UpdateRiskData,
  calculateRiskScore,
  calculateRiskLevel,
  getRiskLevelColor,
} from '../services/riskService';
import { getUsers } from '../services/userService';
import { Risk, User } from '../types';
import '../styles/RiskDetail.css';

function RiskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UpdateRiskData>({});

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskData, usersData] = await Promise.all([
        getRiskById(parseInt(id!, 10)),
        getUsers(),
      ]);
      setRisk(riskData);
      setUsers(usersData);
      setFormData({
        title: riskData.title,
        description: riskData.description,
        category: riskData.category,
        source: riskData.source,
        likelihood: riskData.likelihood,
        impact: riskData.impact,
        mitigationStrategy: riskData.mitigationStrategy,
        mitigationActions: riskData.mitigationActions,
        contingencyPlan: riskData.contingencyPlan,
        riskOwner: riskData.riskOwner,
        department: riskData.department,
        process: riskData.process,
        residualLikelihood: riskData.residualLikelihood,
        residualImpact: riskData.residualImpact,
        affectedStakeholders: riskData.affectedStakeholders,
        regulatoryImplications: riskData.regulatoryImplications,
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load risk');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRisk(parseInt(id!, 10), formData);
      await loadData();
      setEditMode(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update risk');
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  // Check user roles - handle both legacy single role and new roles array
  const userRoles = currentUser?.roleNames || 
                    currentUser?.roles?.map(r => r.name) || 
                    (currentUser?.role ? [currentUser.role] : []);
  
  const canModify = userRoles.some(role => ['admin', 'manager', 'superuser'].includes(role));

  if (loading) {
    return <div className="loading">Loading risk details...</div>;
  }

  if (!risk) {
    return <div className="error">Risk not found</div>;
  }

  // Calculate current and residual scores
  const currentScore = risk.riskScore || calculateRiskScore(risk.likelihood, risk.impact);
  const currentLevel = risk.riskLevel || calculateRiskLevel(currentScore);
  const residualScore = risk.residualRiskScore || 
    (risk.residualLikelihood && risk.residualImpact 
      ? calculateRiskScore(risk.residualLikelihood, risk.residualImpact) 
      : null);
  const residualLevel = residualScore ? calculateRiskLevel(residualScore) : null;

  // For edit mode preview
  const previewScore = formData.likelihood && formData.impact 
    ? calculateRiskScore(formData.likelihood, formData.impact) 
    : currentScore;
  const previewLevel = calculateRiskLevel(previewScore);

  return (
    <div className="risk-detail-container">
      <div className="risk-detail-header">
        <button onClick={() => navigate('/risks')} className="btn-back">
          ← Back to Risks
        </button>
        {canModify && !editMode && (
          <button onClick={() => setEditMode(true)} className="btn-primary">
            Edit Risk
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {editMode ? (
        <form onSubmit={handleUpdate} className="risk-edit-form">
          <div className="form-section">
            <h2>Basic Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Process</label>
                <input
                  type="text"
                  value={formData.process || ''}
                  onChange={e => setFormData({ ...formData, process: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section risk-scoring-section">
            <h2>Risk Assessment</h2>
            <div className="scoring-explanation">
              <p><strong>Risk Score Formula:</strong> Likelihood × Impact</p>
              <p><strong>Scale:</strong> 1 (very low) to 5 (very high)</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Likelihood (1-5)</label>
                <select
                  value={formData.likelihood}
                  onChange={e => setFormData({ ...formData, likelihood: parseInt(e.target.value) })}
                >
                  <option value="1">1 - Very Unlikely</option>
                  <option value="2">2 - Unlikely</option>
                  <option value="3">3 - Possible</option>
                  <option value="4">4 - Likely</option>
                  <option value="5">5 - Very Likely</option>
                </select>
              </div>

              <div className="form-group">
                <label>Impact (1-5)</label>
                <select
                  value={formData.impact}
                  onChange={e => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                >
                  <option value="1">1 - Negligible</option>
                  <option value="2">2 - Minor</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Major</option>
                  <option value="5">5 - Catastrophic</option>
                </select>
              </div>
            </div>

            <div className="risk-score-preview">
              <div className="score-display">
                <span className="label">Risk Score:</span>
                <span className="value">{previewScore}</span>
              </div>
              <div className="level-display">
                <span className="label">Risk Level:</span>
                <span
                  className="value"
                  style={{
                    backgroundColor: getRiskLevelColor(previewLevel),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                  }}
                >
                  {previewLevel.toUpperCase()}
                </span>
              </div>
            </div>

            <h3 style={{ marginTop: '2rem' }}>Residual Risk (After Mitigation)</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Residual Likelihood (1-5)</label>
                <select
                  value={formData.residualLikelihood || ''}
                  onChange={e => setFormData({ 
                    ...formData, 
                    residualLikelihood: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                >
                  <option value="">Not assessed</option>
                  <option value="1">1 - Very Unlikely</option>
                  <option value="2">2 - Unlikely</option>
                  <option value="3">3 - Possible</option>
                  <option value="4">4 - Likely</option>
                  <option value="5">5 - Very Likely</option>
                </select>
              </div>

              <div className="form-group">
                <label>Residual Impact (1-5)</label>
                <select
                  value={formData.residualImpact || ''}
                  onChange={e => setFormData({ 
                    ...formData, 
                    residualImpact: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                >
                  <option value="">Not assessed</option>
                  <option value="1">1 - Negligible</option>
                  <option value="2">2 - Minor</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Major</option>
                  <option value="5">5 - Catastrophic</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Mitigation</h2>
            <div className="form-group">
              <label>Mitigation Strategy</label>
              <textarea
                value={formData.mitigationStrategy || ''}
                onChange={e => setFormData({ ...formData, mitigationStrategy: e.target.value })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Mitigation Actions</label>
              <textarea
                value={formData.mitigationActions || ''}
                onChange={e => setFormData({ ...formData, mitigationActions: e.target.value })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Contingency Plan</label>
              <textarea
                value={formData.contingencyPlan || ''}
                onChange={e => setFormData({ ...formData, contingencyPlan: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="risk-view">
          <div className="risk-header-info">
            <div>
              <h1>{risk.title}</h1>
              <p className="risk-number">{risk.riskNumber}</p>
            </div>
            <div className="risk-status-badge">
              <span className={`status-badge status-${risk.status}`}>
                {risk.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Risk Scoring Display */}
          <div className="risk-scoring-display">
            <div className="score-card">
              <h3>Current Risk</h3>
              <div className="score-details">
                <div className="score-item">
                  <span className="label">Likelihood:</span>
                  <span className="value">{risk.likelihood} / 5</span>
                </div>
                <div className="score-item">
                  <span className="label">Impact:</span>
                  <span className="value">{risk.impact} / 5</span>
                </div>
                <div className="score-item score-total">
                  <span className="label">Risk Score:</span>
                  <span className="value large">{currentScore}</span>
                </div>
                <div className="score-item">
                  <span className="label">Risk Level:</span>
                  <span
                    className="value"
                    style={{
                      backgroundColor: getRiskLevelColor(currentLevel),
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    {currentLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {residualScore && (
              <div className="score-card">
                <h3>Residual Risk (After Mitigation)</h3>
                <div className="score-details">
                  <div className="score-item">
                    <span className="label">Likelihood:</span>
                    <span className="value">{risk.residualLikelihood} / 5</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Impact:</span>
                    <span className="value">{risk.residualImpact} / 5</span>
                  </div>
                  <div className="score-item score-total">
                    <span className="label">Risk Score:</span>
                    <span className="value large">{residualScore}</span>
                  </div>
                  <div className="score-item">
                    <span className="label">Risk Level:</span>
                    <span
                      className="value"
                      style={{
                        backgroundColor: getRiskLevelColor(residualLevel || undefined),
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                      }}
                    >
                      {residualLevel?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="info-section">
            <h2>Description</h2>
            <p>{risk.description}</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Category:</label>
              <span>{risk.category}</span>
            </div>
            <div className="info-item">
              <label>Risk Owner:</label>
              <span>{getUserName(risk.riskOwner)}</span>
            </div>
            <div className="info-item">
              <label>Department:</label>
              <span>{risk.department || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Process:</label>
              <span>{risk.process || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Identified Date:</label>
              <span>{formatDate(risk.identifiedDate)}</span>
            </div>
            <div className="info-item">
              <label>Next Review:</label>
              <span>{formatDate(risk.nextReviewDate)}</span>
            </div>
          </div>

          {risk.mitigationStrategy && (
            <div className="info-section">
              <h2>Mitigation Strategy</h2>
              <p>{risk.mitigationStrategy}</p>
            </div>
          )}

          {risk.mitigationActions && (
            <div className="info-section">
              <h2>Mitigation Actions</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{risk.mitigationActions}</p>
            </div>
          )}

          {risk.contingencyPlan && (
            <div className="info-section">
              <h2>Contingency Plan</h2>
              <p>{risk.contingencyPlan}</p>
            </div>
          )}

          {risk.affectedStakeholders && (
            <div className="info-section">
              <h2>Affected Stakeholders</h2>
              <p>{risk.affectedStakeholders}</p>
            </div>
          )}

          {risk.regulatoryImplications && (
            <div className="info-section">
              <h2>Regulatory Implications</h2>
              <p>{risk.regulatoryImplications}</p>
            </div>
          )}

          <div className="info-section">
            <h2>Audit Trail</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Created By:</label>
                <span>{getUserName(risk.createdBy)}</span>
              </div>
              <div className="info-item">
                <label>Created At:</label>
                <span>{formatDate(risk.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Last Updated:</label>
                <span>{formatDate(risk.updatedAt)}</span>
              </div>
              {risk.lastReviewedBy && (
                <div className="info-item">
                  <label>Last Reviewed By:</label>
                  <span>{getUserName(risk.lastReviewedBy)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskDetail;
