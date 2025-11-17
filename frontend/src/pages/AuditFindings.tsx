import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAuditFindingsByAuditId,
  createAuditFinding,
  updateAuditFinding,
  deleteAuditFinding,
  getAuditFindingStats,
} from '../services/auditFindingService';
import { AuditFinding, AuditFindingStats } from '../types';
import api from '../services/api';
import '../styles/AuditFindings.css';

interface Audit {
  id: number;
  auditNumber: string;
  title: string;
  status: string;
}

function AuditFindings() {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();

  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [stats, setStats] = useState<AuditFindingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<Partial<AuditFinding>>({
    findingNumber: '',
    title: '',
    description: '',
    category: '',
    severity: 'minor',
    status: 'open',
    identifiedDate: new Date().toISOString().split('T')[0],
    requiresNCR: false,
  });

  useEffect(() => {
    if (auditId) {
      loadAuditData();
      loadFindings();
      loadStats();
    }
  }, [auditId]);

  const loadAuditData = async () => {
    try {
      const response = await api.get(`/audits/${auditId}`);
      setAudit(response.data);
    } catch (err) {
      console.error('Failed to load audit:', err);
      setError('Failed to load audit information');
    }
  };

  const loadFindings = async () => {
    try {
      setLoading(true);
      const data = await getAuditFindingsByAuditId(parseInt(auditId!, 10));
      setFindings(data);
    } catch (err) {
      console.error('Failed to load findings:', err);
      setError('Failed to load audit findings');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getAuditFindingStats(parseInt(auditId!, 10));
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const findingData = {
        ...formData,
        auditId: parseInt(auditId!, 10),
      };

      if (editingFinding) {
        await updateAuditFinding(editingFinding.id!, findingData);
        setSuccessMessage('Finding updated successfully');
      } else {
        await createAuditFinding(findingData);
        setSuccessMessage('Finding created successfully');
      }

      setShowForm(false);
      setEditingFinding(null);
      resetForm();
      loadFindings();
      loadStats();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to save finding');
    }
  };

  const handleEdit = (finding: AuditFinding) => {
    setEditingFinding(finding);
    setFormData({
      findingNumber: finding.findingNumber,
      title: finding.title,
      description: finding.description,
      category: finding.category,
      severity: finding.severity,
      status: finding.status,
      identifiedDate: finding.identifiedDate.split('T')[0],
      evidence: finding.evidence,
      rootCause: finding.rootCause,
      auditCriteria: finding.auditCriteria,
      clauseReference: finding.clauseReference,
      recommendations: finding.recommendations,
      requiresNCR: finding.requiresNCR,
      targetCloseDate: finding.targetCloseDate?.split('T')[0],
      assignedTo: finding.assignedTo,
      department: finding.department,
      affectedArea: finding.affectedArea,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this finding?')) return;

    try {
      await deleteAuditFinding(id);
      setSuccessMessage('Finding deleted successfully');
      loadFindings();
      loadStats();
    } catch (err) {
      setError('Failed to delete finding');
    }
  };

  const resetForm = () => {
    setFormData({
      findingNumber: '',
      title: '',
      description: '',
      category: '',
      severity: 'minor',
      status: 'open',
      identifiedDate: new Date().toISOString().split('T')[0],
      requiresNCR: false,
    });
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'major':
        return 'severity-major';
      case 'minor':
        return 'severity-minor';
      case 'observation':
        return 'severity-observation';
      default:
        return '';
    }
  };

  if (loading && findings.length === 0) {
    return <div className="loading">Loading findings...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Findings</h1>
          {audit && (
            <p className="subtitle">
              {audit.auditNumber} - {audit.title}
            </p>
          )}
        </div>
        <div>
          <button className="btn-secondary" onClick={() => navigate(`/audits/${auditId}/execute`)}>
            Back to Audit
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Add Finding
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Findings</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Critical</h3>
            <p className="stat-value severity-critical">{stats.bySeverity.critical || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Major</h3>
            <p className="stat-value severity-major">{stats.bySeverity.major || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Minor</h3>
            <p className="stat-value severity-minor">{stats.bySeverity.minor || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Observation</h3>
            <p className="stat-value severity-observation">{stats.bySeverity.observation || 0}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingFinding ? 'Edit Finding' : 'New Finding'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Finding Number *</label>
                  <input
                    type="text"
                    value={formData.findingNumber}
                    onChange={(e) => setFormData({ ...formData, findingNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Severity *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        severity: e.target.value as AuditFinding['severity'],
                      })
                    }
                    required
                  >
                    <option value="observation">Observation</option>
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Process, Documentation, Product Quality"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AuditFinding['status'] })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="action_planned">Action Planned</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Identified Date *</label>
                  <input
                    type="date"
                    value={formData.identifiedDate}
                    onChange={(e) => setFormData({ ...formData, identifiedDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Target Close Date</label>
                  <input
                    type="date"
                    value={formData.targetCloseDate || ''}
                    onChange={(e) => setFormData({ ...formData, targetCloseDate: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Clause Reference</label>
                  <input
                    type="text"
                    value={formData.clauseReference || ''}
                    onChange={(e) => setFormData({ ...formData, clauseReference: e.target.value })}
                    placeholder="e.g., ISO 9001:2015 8.5.1"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Evidence</label>
                  <textarea
                    value={formData.evidence || ''}
                    onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Root Cause</label>
                  <textarea
                    value={formData.rootCause || ''}
                    onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Recommendations</label>
                  <textarea
                    value={formData.recommendations || ''}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.requiresNCR || false}
                      onChange={(e) => setFormData({ ...formData, requiresNCR: e.target.checked })}
                    />
                    Requires NCR
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingFinding ? 'Update' : 'Create'} Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="findings-list">
        {findings.length === 0 ? (
          <p>No findings recorded for this audit.</p>
        ) : (
          findings.map((finding) => (
            <div key={finding.id} className="finding-card">
              <div className="finding-header">
                <div>
                  <h3>{finding.title}</h3>
                  <p className="finding-number">{finding.findingNumber}</p>
                </div>
                <div className="finding-badges">
                  <span className={`severity-badge ${getSeverityBadgeClass(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className={`status-badge status-${finding.status}`}>{finding.status}</span>
                </div>
              </div>

              <div className="finding-body">
                <p><strong>Category:</strong> {finding.category}</p>
                <p><strong>Description:</strong> {finding.description}</p>
                {finding.clauseReference && (
                  <p><strong>Clause:</strong> {finding.clauseReference}</p>
                )}
                {finding.recommendations && (
                  <p><strong>Recommendations:</strong> {finding.recommendations}</p>
                )}
                {finding.requiresNCR && (
                  <p className="ncr-required">
                    <strong>NCR Required</strong>
                    {finding.ncrId && ` (NCR #${finding.ncrId})`}
                  </p>
                )}
                <p className="finding-date">
                  <strong>Identified:</strong> {new Date(finding.identifiedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="finding-actions">
                <button className="btn-small" onClick={() => handleEdit(finding)}>
                  Edit
                </button>
                <button className="btn-small btn-danger" onClick={() => handleDelete(finding.id!)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditFindings;
