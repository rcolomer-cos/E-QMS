import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCAPAById, 
  updateCAPAStatus, 
  updateCAPA, 
  completeCAPA, 
  verifyCAPA,
  UpdateCAPAData,
  CompleteCAPAData,
  VerifyCAPAData,
  CAPA as CAPAType 
} from '../services/capaService';
import { getUsers } from '../services/userService';
import { getAttachmentsByEntity, deleteAttachment, uploadAttachment, Attachment } from '../services/attachmentService';
import { User } from '../types';
import AttachmentGallery from '../components/AttachmentGallery';
import FileUpload from '../components/FileUpload';
import '../styles/CAPADetail.css';

function CAPADetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [capa, setCapa] = useState<CAPAType | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateCAPAData>({});
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [completionData, setCompletionData] = useState<CompleteCAPAData>({
    rootCause: '',
    proposedAction: '',
  });
  const [verificationData, setVerificationData] = useState<VerifyCAPAData>({
    effectiveness: '',
  });

  useEffect(() => {
    loadData();
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [capaData, attachmentsData, usersData] = await Promise.all([
        getCAPAById(parseInt(id, 10)),
        getAttachmentsByEntity('capa', parseInt(id, 10)),
        getUsers(),
      ]);

      setCapa(capaData);
      setAttachments(attachmentsData.data);
      setUsers(usersData);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load CAPA details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: CAPAType['status']) => {
    if (!capa) return;

    try {
      await updateCAPAStatus(capa.id, { status: newStatus });
      setCapa({ ...capa, status: newStatus });
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleEdit = () => {
    if (!capa) return;
    
    setEditData({
      title: capa.title,
      description: capa.description,
      proposedAction: capa.proposedAction,
      priority: capa.priority,
      rootCause: capa.rootCause || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!capa) return;

    try {
      await updateCAPA(capa.id, editData);
      await loadData();
      setIsEditing(false);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update CAPA');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleComplete = async () => {
    if (!capa) return;

    try {
      await completeCAPA(capa.id, completionData);
      setShowCompleteModal(false);
      setCompletionData({ rootCause: '', proposedAction: '' });
      await loadData();
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to complete CAPA');
    }
  };

  const handleVerify = async () => {
    if (!capa) return;

    try {
      await verifyCAPA(capa.id, verificationData);
      setShowVerifyModal(false);
      setVerificationData({ effectiveness: '' });
      await loadData();
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to verify CAPA');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!capa) return;

    try {
      await uploadAttachment(file, 'capa', capa.id, `CAPA proof of action: ${file.name}`);
      const attachmentsData = await getAttachmentsByEntity('capa', capa.id);
      setAttachments(attachmentsData.data);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to upload attachment');
      throw err;
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to delete attachment');
      throw err;
    }
  };

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getUserName = (userId: number | undefined) => {
    if (!userId) return 'Unassigned';
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User ${userId}`;
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      open: 'status-open',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      verified: 'status-verified',
      closed: 'status-closed',
    };
    return statusMap[status] || 'status-open';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high',
      urgent: 'priority-urgent',
    };
    return priorityMap[priority] || 'priority-low';
  };

  const isOverdue = (targetDate: string | undefined) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date() && capa?.status !== 'closed' && capa?.status !== 'verified';
  };

  const canEdit = () => {
    if (!currentUser || !capa) return false;
    // Admin, Manager, Auditor can edit, or the action owner
    return ['admin', 'manager', 'auditor'].includes(currentUser.role.toLowerCase()) || 
           currentUser.id === capa.actionOwner;
  };

  const canComplete = () => {
    if (!currentUser || !capa) return false;
    // Only action owner can complete when status is in_progress
    return capa.status === 'in_progress' && currentUser.id === capa.actionOwner;
  };

  const canVerify = () => {
    if (!currentUser || !capa) return false;
    // Admin, Manager, Auditor can verify (but not the action owner)
    return capa.status === 'completed' && 
           ['admin', 'manager', 'auditor'].includes(currentUser.role.toLowerCase()) &&
           currentUser.id !== capa.actionOwner;
  };

  const canChangeStatus = () => {
    if (!currentUser || !capa) return false;
    // Admin, Manager, Auditor can change status
    return ['admin', 'manager', 'auditor'].includes(currentUser.role.toLowerCase());
  };

  if (loading) {
    return <div className="page"><p>Loading CAPA details...</p></div>;
  }

  if (error && !capa) {
    return (
      <div className="page">
        <p className="error">{error}</p>
        <button onClick={() => navigate('/capa')} className="btn-secondary">
          Back to CAPA List
        </button>
      </div>
    );
  }

  if (!capa) {
    return (
      <div className="page">
        <p>CAPA not found</p>
        <button onClick={() => navigate('/capa')} className="btn-secondary">
          Back to CAPA List
        </button>
      </div>
    );
  }

  return (
    <div className="page capa-detail">
      <div className="page-header">
        <h1>CAPA Details</h1>
        <div className="header-actions">
          {!isEditing && canEdit() && (
            <button onClick={handleEdit} className="btn-secondary">
              Edit
            </button>
          )}
          <button onClick={() => navigate('/capa')} className="btn-secondary">
            Back to List
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="capa-content">
        <div className="info-section">
          <div className="section-header">
            <h2>Basic Information</h2>
            <div className="status-badges">
              <span className={`badge ${getStatusBadgeClass(capa.status)}`}>
                {capa.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`badge ${getPriorityBadgeClass(capa.priority)}`}>
                {capa.priority.toUpperCase()}
              </span>
              {isOverdue(capa.targetDate) && (
                <span className="badge badge-overdue">⚠ OVERDUE</span>
              )}
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>CAPA Number:</label>
              <span>{capa.capaNumber}</span>
            </div>
            <div className="info-item">
              <label>Type:</label>
              <span style={{ textTransform: 'capitalize' }}>{capa.type}</span>
            </div>
            <div className="info-item">
              <label>Source:</label>
              <span>{capa.source}</span>
            </div>
            <div className="info-item">
              <label>Created:</label>
              <span>{formatDate(capa.createdAt)}</span>
            </div>
          </div>

          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  maxLength={500}
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  maxLength={2000}
                />
              </div>
              <div className="form-group">
                <label>Priority:</label>
                <select
                  value={editData.priority || capa.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEdit} className="btn-primary">
                  Save Changes
                </button>
                <button onClick={handleCancelEdit} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="info-item full-width">
                <label>Title:</label>
                <span>{capa.title}</span>
              </div>
              <div className="info-item full-width">
                <label>Description:</label>
                <p className="description-text">{capa.description}</p>
              </div>
            </>
          )}
        </div>

        <div className="info-section">
          <h2>Action Details</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Action Owner:</label>
              <span>{capa.actionOwnerName || getUserName(capa.actionOwner)}</span>
            </div>
            <div className="info-item">
              <label>Target Date:</label>
              <span className={isOverdue(capa.targetDate) ? 'overdue-text' : ''}>
                {formatDate(capa.targetDate)}
                {isOverdue(capa.targetDate) && <span className="overdue-indicator"> ⚠ OVERDUE</span>}
              </span>
            </div>
            {capa.completedDate && (
              <div className="info-item">
                <label>Completed Date:</label>
                <span>{formatDate(capa.completedDate)}</span>
              </div>
            )}
          </div>

          <div className="info-item full-width">
            <label>Proposed Action:</label>
            <p className="description-text">{capa.proposedAction}</p>
          </div>

          {capa.rootCause && (
            <div className="info-item full-width">
              <label>Root Cause Analysis:</label>
              <p className="description-text">{capa.rootCause}</p>
            </div>
          )}
        </div>

        {capa.status === 'verified' || capa.status === 'closed' ? (
          <div className="info-section">
            <h2>Verification</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Verified By:</label>
                <span>{capa.verifiedByName || getUserName(capa.verifiedBy)}</span>
              </div>
              <div className="info-item">
                <label>Verified Date:</label>
                <span>{formatDate(capa.verifiedDate)}</span>
              </div>
              {capa.closedDate && (
                <div className="info-item">
                  <label>Closed Date:</label>
                  <span>{formatDate(capa.closedDate)}</span>
                </div>
              )}
            </div>
            {capa.effectiveness && (
              <div className="info-item full-width">
                <label>Effectiveness Verification:</label>
                <p className="description-text">{capa.effectiveness}</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="info-section">
          <h2>Attachments & Proof of Action</h2>
          
          {canEdit() && (
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="btn-secondary"
              style={{ marginBottom: '16px' }}
            >
              {showUploadSection ? 'Hide Upload' : 'Upload Proof of Action'}
            </button>
          )}

          {showUploadSection && (
            <div className="upload-section">
              <FileUpload
                onFileSelect={() => {}}
                onUpload={handleFileUpload}
              />
            </div>
          )}

          <AttachmentGallery
            attachments={attachments}
            onDelete={canEdit() ? handleDeleteAttachment : undefined}
            canDelete={canEdit()}
          />
        </div>

        <div className="action-section">
          {canChangeStatus() && (
            <div className="status-actions">
              <h3>Status Actions</h3>
              <div className="button-group">
                {capa.status === 'open' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="btn-primary"
                  >
                    Start Progress
                  </button>
                )}
                {capa.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('open')}
                      className="btn-secondary"
                    >
                      Reopen
                    </button>
                  </>
                )}
                {capa.status === 'verified' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="btn-primary"
                  >
                    Close CAPA
                  </button>
                )}
              </div>
            </div>
          )}

          {canComplete() && (
            <button
              onClick={() => {
                setCompletionData({
                  rootCause: capa.rootCause || '',
                  proposedAction: capa.proposedAction || '',
                });
                setShowCompleteModal(true);
              }}
              className="btn-primary"
            >
              Mark as Completed
            </button>
          )}

          {canVerify() && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="btn-primary"
            >
              Verify Effectiveness
            </button>
          )}
        </div>
      </div>

      {/* Complete CAPA Modal */}
      {showCompleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Complete CAPA</h2>
            <p><strong>CAPA:</strong> {capa.capaNumber} - {capa.title}</p>
            <div className="form-group">
              <label>Root Cause Analysis:</label>
              <textarea
                value={completionData.rootCause}
                onChange={(e) => setCompletionData({ ...completionData, rootCause: e.target.value })}
                rows={4}
                placeholder="Describe the root cause analysis findings..."
              />
            </div>
            <div className="form-group">
              <label>Action Taken:</label>
              <textarea
                value={completionData.proposedAction}
                onChange={(e) => setCompletionData({ ...completionData, proposedAction: e.target.value })}
                rows={4}
                placeholder="Describe the corrective/preventive action that was taken..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleComplete}>
                Complete CAPA
              </button>
              <button className="btn-secondary" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify CAPA Modal */}
      {showVerifyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Verify CAPA Effectiveness</h2>
            <p><strong>CAPA:</strong> {capa.capaNumber} - {capa.title}</p>
            <div className="form-group">
              <label>Effectiveness Verification:</label>
              <textarea
                value={verificationData.effectiveness}
                onChange={(e) => setVerificationData({ effectiveness: e.target.value })}
                rows={6}
                placeholder="Describe the effectiveness of the action taken. Provide evidence that the action has resolved the issue or prevented recurrence..."
                required
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleVerify}
                disabled={!verificationData.effectiveness.trim()}
              >
                Verify CAPA
              </button>
              <button className="btn-secondary" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CAPADetail;
