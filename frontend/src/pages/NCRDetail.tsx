import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNCRById, updateNCRStatus, updateNCR, UpdateNCRData, deleteNCR } from '../services/ncrService';
import { getUsers } from '../services/userService';
import { getAttachmentsByEntity, deleteAttachment, uploadAttachment } from '../services/attachmentService';
import { NCR as NCRType, User } from '../types';
import { Attachment } from '../services/attachmentService';
import AttachmentGallery from '../components/AttachmentGallery';
import FileUpload from '../components/FileUpload';
import '../styles/NCRDetail.css';

function NCRDetail() {
  const { t } = useTranslation();
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

  const hasRole = (roleNames: string[]) => {
    if (!currentUser) return false;
    const userRoles = currentUser.roleNames || [];
    return roleNames.some(role => userRoles.includes(role));
  };

  const canEdit = hasRole(['superuser', 'admin', 'manager', 'auditor']);
  const canDelete = hasRole(['superuser', 'admin', 'manager']);

  const handleDelete = async () => {
    if (!ncr || !window.confirm(`${t('common.confirmDelete')} ${ncr.ncrNumber}?`)) {
      return;
    }

    try {
      await deleteNCR(ncr.id!);
      navigate('/ncr');
    } catch (err: any) {
      setError(err.response?.data?.error || t('messages.deleteError'));
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!ncr) {
    return (
      <div className="error-page">
        <h2>{t('ncr.title')} {t('messages.noData')}</h2>
        <button className="btn-primary" onClick={() => navigate('/ncr')}>
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="ncr-detail-page">
      <div className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate('/ncr')}>
            ← {t('common.back')}
          </button>
          <h1>{ncr.ncrNumber}</h1>
          <p className="subtitle">{ncr.title}</p>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-secondary" onClick={() => navigate(`/ncr/${id}/edit`)}>
              ✏️ {t('ncr.editNCR')}
            </button>
          )}
          {canDelete && (
            <button className="btn-danger" onClick={handleDelete}>
              🗑️ {t('ncr.deleteNCR')}
            </button>
          )}
          <span className={`status-badge status-${ncr.status}`}>
            {ncr.status.replace('_', ' ')}
          </span>
          <span className={`severity-badge severity-${ncr.severity}`}>
            {t(`ncr.severities.${ncr.severity}`)}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* NCR Details */}
      <div className="ncr-content">
        <div className="content-section">
          <h2>{t('ncr.title')} {t('common.info')}</h2>
          
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>{t('ncr.ncrTitle')}</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label>{t('ncr.description')}</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={5}
                  maxLength={2000}
                />
              </div>

              <div className="form-group">
                <label>{t('ncr.rootCause')}</label>
                <textarea
                  value={editData.rootCause || ''}
                  onChange={(e) => setEditData({ ...editData, rootCause: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('ncr.rootCause')}
                />
              </div>

              <div className="form-group">
                <label>{t('ncr.containmentAction')}</label>
                <textarea
                  value={editData.containmentAction || ''}
                  onChange={(e) => setEditData({ ...editData, containmentAction: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('ncr.immediateAction')}
                />
              </div>

              <div className="form-group">
                <label>{t('ncr.correctiveAction')}</label>
                <textarea
                  value={editData.correctiveAction || ''}
                  onChange={(e) => setEditData({ ...editData, correctiveAction: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('ncr.correctiveAction')}
                />
              </div>

              <div className="form-group">
                <label>{t('ncr.assignedTo')}</label>
                <select
                  value={editData.assignedTo || ''}
                  onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                >
                  <option value="">{t('ncr.unassigned')}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCancelEdit}>
                  {t('common.cancel')}
                </button>
                <button className="btn-primary" onClick={handleSaveEdit}>
                  {t('common.save')}
                </button>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-row">
                <div className="info-item">
                  <label>{t('ncr.source')}</label>
                  <p>{t(`ncr.sources.${ncr.source}`)}</p>
                </div>
                <div className="info-item">
                  <label>{t('ncr.category')}</label>
                  <p>{t(`ncr.categories.${ncr.category}`)}</p>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <label>{t('ncr.detectedDate')}</label>
                  <p>{formatDate(ncr.detectedDate)}</p>
                </div>
                <div className="info-item">
                  <label>{t('ncr.reportedBy')}</label>
                  <p>{getUserName(ncr.reportedBy)}</p>
                </div>
              </div>

              <div className="info-item">
                <label>{t('ncr.assignedTo')}</label>
                <p>{getUserName(ncr.assignedTo)}</p>
              </div>

              {ncr.verifiedBy && (
                <div className="info-row">
                  <div className="info-item">
                    <label>{t('ncr.verifiedBy')}</label>
                    <p>{getUserName(ncr.verifiedBy)}</p>
                  </div>
                  <div className="info-item">
                    <label>{t('ncr.verifiedDate')}</label>
                    <p>{formatDate(ncr.verifiedDate)}</p>
                  </div>
                </div>
              )}

              {ncr.closedDate && (
                <div className="info-item">
                  <label>{t('ncr.closedDate')}</label>
                  <p>{formatDate(ncr.closedDate)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description Block */}
        <div className="content-section">
          <h2>{t('ncr.description')}</h2>
          <div className="text-content">
            <p>{ncr.description}</p>
          </div>
        </div>

        {/* Root Cause Block */}
        {ncr.rootCause && (
          <div className="content-section">
            <h2>{t('ncr.rootCause')}</h2>
            <div className="text-content">
              <p>{ncr.rootCause}</p>
            </div>
          </div>
        )}

        {/* Containment Action Block */}
        {ncr.containmentAction && (
          <div className="content-section">
            <h2>{t('ncr.containmentAction')}</h2>
            <div className="text-content">
              <p>{ncr.containmentAction}</p>
            </div>
          </div>
        )}

        {/* Corrective Action Block */}
        {ncr.correctiveAction && (
          <div className="content-section">
            <h2>{t('ncr.correctiveAction')}</h2>
            <div className="text-content">
              <p>{ncr.correctiveAction}</p>
            </div>
          </div>
        )}

        {/* Linked Inspection Record */}
        {ncr.inspectionRecordId && (
          <div className="content-section">
            <h2>{t('common.linkedRecord')}</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>{t('common.inspectionRecord')}</label>
                <p>
                  <button 
                    className="btn-link"
                    onClick={() => navigate(`/inspection-records/${ncr.inspectionRecordId}`)}
                    style={{ 
                      color: '#3498db', 
                      textDecoration: 'underline', 
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      font: 'inherit'
                    }}
                  >
                    #{ncr.inspectionRecordId} - {t('common.view')}
                  </button>
                </p>
              </div>
              <div className="info-item">
                <label>{t('ncr.source')}</label>
                <p>{t('ncr.inspection')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Management */}
        {!isEditing && canEdit && (
          <div className="content-section">
            <h2>{t('common.status')} {t('common.management')}</h2>
            <div className="status-actions">
              <button
                className="btn-secondary"
                onClick={() => handleStatusChange('in_progress')}
                disabled={ncr.status === 'in_progress'}
              >
                {t('common.inProgress')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleStatusChange('resolved')}
                disabled={ncr.status === 'resolved'}
              >
                {t('common.resolved')}
              </button>
              {canDelete && (
                <button
                  className="btn-danger"
                  onClick={() => handleStatusChange('closed')}
                  disabled={ncr.status === 'closed'}
                >
                  {t('common.close')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        <div className="content-section">
          <div className="section-header">
            <h2>{t('common.attachments')} ({attachments.length})</h2>
            <button
              className="btn-primary"
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              {showUploadSection ? `✕ ${t('common.cancel')}` : `+ ${t('common.add')}`}
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
