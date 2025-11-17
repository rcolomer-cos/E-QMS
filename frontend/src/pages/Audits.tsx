import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Audit } from '../types';
import { submitAuditForReview, approveAudit, rejectAudit } from '../services/auditService';

function Audits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComments, setReviewComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const response = await api.get('/audits');
      setAudits(response.data);
    } catch (error) {
      console.error('Failed to load audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAudit = (auditId: number) => {
    navigate(`/audits/${auditId}/execute`);
  };

  const handleSubmitForReview = async (auditId: number) => {
    if (!confirm('Are you sure you want to submit this audit for review?')) {
      return;
    }

    try {
      setActionLoading(true);
      await submitAuditForReview(auditId);
      alert('Audit submitted for review successfully');
      await loadAudits();
    } catch (error: any) {
      console.error('Failed to submit audit for review:', error);
      alert(error.response?.data?.error || 'Failed to submit audit for review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReviewModal = (audit: Audit, action: 'approve' | 'reject') => {
    setSelectedAudit(audit);
    setReviewAction(action);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedAudit(null);
    setReviewComments('');
  };

  const handleSubmitReview = async () => {
    if (!selectedAudit) return;

    if (reviewAction === 'reject' && !reviewComments.trim()) {
      alert('Comments are required when rejecting an audit');
      return;
    }

    try {
      setActionLoading(true);
      if (reviewAction === 'approve') {
        await approveAudit(selectedAudit.id, reviewComments || undefined);
        alert('Audit approved successfully');
      } else {
        await rejectAudit(selectedAudit.id, reviewComments);
        alert('Audit rejected successfully');
      }
      handleCloseReviewModal();
      await loadAudits();
    } catch (error: any) {
      console.error('Failed to review audit:', error);
      alert(error.response?.data?.error || 'Failed to review audit');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <div className="loading">Loading audits...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Audit Management</h1>
        <button className="btn-primary">Schedule Audit</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Audit Number</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Scheduled Date</th>
            <th>Reviewer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {audits.length === 0 ? (
            <tr>
              <td colSpan={7}>No audits found</td>
            </tr>
          ) : (
            audits.map((audit) => (
              <tr key={audit.id}>
                <td>{audit.auditNumber}</td>
                <td>{audit.title}</td>
                <td>{audit.auditType}</td>
                <td>
                  <span className={`status-badge status-${audit.status}`}>
                    {getStatusLabel(audit.status)}
                  </span>
                </td>
                <td>{new Date(audit.scheduledDate).toLocaleDateString()}</td>
                <td>
                  {audit.reviewedAt ? (
                    <span className="text-small">
                      {new Date(audit.reviewedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn-small">View</button>
                    <button className="btn-small">Edit</button>
                    
                    {(audit.status === 'planned' || audit.status === 'in_progress') && (
                      <button 
                        className="btn-small btn-primary"
                        onClick={() => handleExecuteAudit(audit.id)}
                      >
                        Execute
                      </button>
                    )}
                    
                    {audit.status === 'completed' && (
                      <button 
                        className="btn-small btn-primary"
                        onClick={() => handleSubmitForReview(audit.id)}
                        disabled={actionLoading}
                      >
                        Submit for Review
                      </button>
                    )}
                    
                    {audit.status === 'pending_review' && (
                      <>
                        <button 
                          className="btn-small btn-success"
                          onClick={() => handleOpenReviewModal(audit, 'approve')}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => handleOpenReviewModal(audit, 'reject')}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Review Modal */}
      {showReviewModal && selectedAudit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{reviewAction === 'approve' ? 'Approve Audit' : 'Reject Audit'}</h2>
              <button className="close-button" onClick={handleCloseReviewModal}>×</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Audit:</strong> {selectedAudit.auditNumber} - {selectedAudit.title}
              </p>
              <div className="form-group">
                <label htmlFor="reviewComments">
                  Comments {reviewAction === 'reject' && <span className="text-danger">*</span>}
                </label>
                <textarea
                  id="reviewComments"
                  className="form-control"
                  rows={4}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={reviewAction === 'approve' 
                    ? 'Optional comments about the approval...' 
                    : 'Please provide the reason for rejection...'}
                  required={reviewAction === 'reject'}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleCloseReviewModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className={reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'}
                onClick={handleSubmitReview}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Audits;
