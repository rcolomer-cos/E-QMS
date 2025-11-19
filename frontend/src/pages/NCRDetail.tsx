import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNCRById, updateNCRStatus, updateNCR, UpdateNCRData } from '../services/ncrService';
import { getUsers } from '../services/userService';
import { getAttachmentsByEntity, deleteAttachment, uploadAttachment } from '../services/attachmentService';
import { NCR as NCRType, User } from '../types';
import { Attachment } from '../services/attachmentService';
import AttachmentGallery from '../components/AttachmentGallery';
import FileUpload from '../components/FileUpload';
import '../styles/NCRDetail.css';

function NCRDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [ncr, setNcr] = useState<NCRType | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateNCRData>({});

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
      const [ncrData, attachmentsData, usersData] = await Promise.all([
        getNCRById(parseInt(id, 10)),
        getAttachmentsByEntity('ncr', parseInt(id, 10)),
        getUsers(),
      ]);

      setNcr(ncrData);
      setAttachments(attachmentsData.data);
      setUsers(usersData);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load NCR details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: NCRType['status']) => {
    if (!ncr) return;

    try {
      await updateNCRStatus(ncr.id!, newStatus);
      setNcr({ ...ncr, status: newStatus });
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleEdit = () => {
    if (!ncr) return;
    
    setEditData({
      title: ncr.title,
      description: ncr.description,
      rootCause: ncr.rootCause || '',
      containmentAction: ncr.containmentAction || '',
      correctiveAction: ncr.correctiveAction || '',
      assignedTo: ncr.assignedTo,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!ncr) return;

    try {
      await updateNCR(ncr.id!, editData);
      // Reload data to get updated NCR
      await loadData();
      setIsEditing(false);
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update NCR');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleFileUpload = async (file: File) => {
    if (!ncr) return;

    try {
      await uploadAttachment(file, 'ncr', ncr.id!, `NCR attachment: ${file.name}`);
      // Reload attachments
      const attachmentsData = await getAttachmentsByEntity('ncr', ncr.id!);
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
      // Remove from local state
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
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  const canEdit = !!(currentUser?.role && ['admin', 'manager', 'auditor'].includes(currentUser.role));
  const canDelete = !!(currentUser?.role && ['admin', 'manager'].includes(currentUser.role));

  if (loading) {
    return <div className="loading">Loading NCR details...</div>;
  }

  if (!ncr) {
    return (
      <div className="error-page">
        <h2>NCR Not Found</h2>
        <button className="tw-btn tw-btn-primary" onClick={() => navigate('/ncrs')}>
          Back to NCRs
        </button>
      </div>
    );
  }

  return (
    <div className="ncr-detail-page">
      <div className="page-header">
        <div>
          <button className="tw-btn tw-btn-link" onClick={() => navigate('/ncrs')}>
            ← Back to NCRs
          </button>
          <h1>{ncr.ncrNumber}</h1>
          <p className="subtitle">{ncr.title}</p>
        </div>
        <div className="header-actions">
          {!isEditing && canEdit && (
            <button className="tw-btn tw-btn-secondary" onClick={handleEdit}>
              ✏️ Edit NCR
            </button>
          )}
          <span className={`status-badge status-${ncr.status}`}>
            {ncr.status.replace('_', ' ')}
          </span>
          <span className={`severity-badge severity-${ncr.severity}`}>
            {ncr.severity}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* NCR Details */}
      <div className="ncr-content">
        <div className="content-section">
          <h2>NCR Information</h2>
          
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={5}
                  maxLength={2000}
                />
              </div>

              <div className="form-group">
                <label>Root Cause</label>
                <textarea
                  value={editData.rootCause || ''}
                  onChange={(e) => setEditData({ ...editData, rootCause: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Root cause analysis findings..."
                />
              </div>

              <div className="form-group">
                <label>Containment Action</label>
                <textarea
                  value={editData.containmentAction || ''}
                  onChange={(e) => setEditData({ ...editData, containmentAction: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Immediate containment actions taken..."
                />
              </div>

              <div className="form-group">
                <label>Corrective Action</label>
                <textarea
                  value={editData.correctiveAction || ''}
                  onChange={(e) => setEditData({ ...editData, correctiveAction: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Long-term corrective actions..."
                />
              </div>

              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={editData.assignedTo || ''}
                  onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button className="tw-btn tw-btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button className="tw-btn tw-btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <label>Description</label>
                <p>{ncr.description}</p>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <label>Source</label>
                  <p>{ncr.source}</p>
                </div>
                <div className="info-item">
                  <label>Category</label>
                  <p>{ncr.category}</p>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <label>Detected Date</label>
                  <p>{formatDate(ncr.detectedDate)}</p>
                </div>
                <div className="info-item">
                  <label>Reported By</label>
                  <p>{getUserName(ncr.reportedBy)}</p>
                </div>
              </div>

              <div className="info-item">
                <label>Assigned To</label>
                <p>{getUserName(ncr.assignedTo)}</p>
              </div>

              {ncr.rootCause && (
                <div className="info-item">
                  <label>Root Cause</label>
                  <p>{ncr.rootCause}</p>
                </div>
              )}

              {ncr.containmentAction && (
                <div className="info-item">
                  <label>Containment Action</label>
                  <p>{ncr.containmentAction}</p>
                </div>
              )}

              {ncr.correctiveAction && (
                <div className="info-item">
                  <label>Corrective Action</label>
                  <p>{ncr.correctiveAction}</p>
                </div>
              )}

              {ncr.verifiedBy && (
                <div className="info-row">
                  <div className="info-item">
                    <label>Verified By</label>
                    <p>{getUserName(ncr.verifiedBy)}</p>
                  </div>
                  <div className="info-item">
                    <label>Verified Date</label>
                    <p>{formatDate(ncr.verifiedDate)}</p>
                  </div>
                </div>
              )}

              {ncr.closedDate && (
                <div className="info-item">
                  <label>Closed Date</label>
                  <p>{formatDate(ncr.closedDate)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Linked Inspection Record */}
        {ncr.inspectionRecordId && (
          <div className="content-section">
            <h2>Linked Inspection Record</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Inspection Record ID</label>
                <p>
                  <button 
                    className="tw-btn tw-btn-link"
                    onClick={() => navigate(`/inspection-records/${ncr.inspectionRecordId}`)}
                    style={{ 
                      color: '#007bff', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      font: 'inherit'
                    }}
                  >
                    #{ncr.inspectionRecordId} - View Inspection Record
                  </button>
                </p>
              </div>
              <div className="info-item">
                <label>Source</label>
                <p>This NCR was created from a failed inspection</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Management */}
        {!isEditing && canEdit && (
          <div className="content-section">
            <h2>Status Management</h2>
            <div className="status-actions">
              <button
                className="tw-btn tw-btn-secondary tw-btn-small"
                onClick={() => handleStatusChange('in_progress')}
                disabled={ncr.status === 'in_progress'}
              >
                Mark In Progress
              </button>
              <button
                className="tw-btn tw-btn-secondary tw-btn-small"
                onClick={() => handleStatusChange('resolved')}
                disabled={ncr.status === 'resolved'}
              >
                Mark Resolved
              </button>
              {canDelete && (
                <button
                  className="tw-btn tw-btn-danger tw-btn-small"
                  onClick={() => handleStatusChange('closed')}
                  disabled={ncr.status === 'closed'}
                >
                  Close NCR
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        <div className="content-section">
          <div className="section-header">
            <h2>Attachments ({attachments.length})</h2>
            <button
              className="tw-btn tw-btn-primary tw-btn-small"
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              {showUploadSection ? '✕ Cancel' : '+ Add Attachment'}
            </button>
          </div>

          {showUploadSection && (
            <div className="upload-section">
              <FileUpload
                onFileSelect={(file) => console.log('File selected:', file.name)}
                onUpload={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                maxSizeMB={10}
              />
            </div>
          )}

          <AttachmentGallery
            attachments={attachments}
            onDelete={canDelete ? handleDeleteAttachment : undefined}
            canDelete={canDelete || false}
          />
        </div>
      </div>
    </div>
  );
}

export default NCRDetail;
