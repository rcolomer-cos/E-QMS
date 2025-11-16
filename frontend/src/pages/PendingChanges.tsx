import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingDocuments, approveDocument, rejectDocument, requestChanges } from '../services/documentService';
import { PendingDocument } from '../types';
import '../styles/PendingChanges.css';

function PendingChanges() {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'request-changes'>('approve');
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [modalInput, setModalInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    try {
      setLoading(true);
      const data = await getPendingDocuments();
      setDocuments(data);
      setError('');
    } catch (err) {
      console.error('Failed to load pending documents:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load pending documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (id: number) => {
    navigate(`/documents/${id}`);
  };

  const openModal = (type: 'approve' | 'reject' | 'request-changes', doc: PendingDocument) => {
    setModalType(type);
    setSelectedDocument(doc);
    setModalInput('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
    setModalInput('');
  };

  const handleAction = async () => {
    if (!selectedDocument) return;

    try {
      setActionLoading(selectedDocument.id);

      if (modalType === 'approve') {
        await approveDocument(selectedDocument.id, modalInput || undefined);
      } else if (modalType === 'reject') {
        if (!modalInput.trim()) {
          setError('Rejection reason is required');
          return;
        }
        await rejectDocument(selectedDocument.id, modalInput);
      } else if (modalType === 'request-changes') {
        if (!modalInput.trim()) {
          setError('Change request description is required');
          return;
        }
        await requestChanges(selectedDocument.id, modalInput);
      }

      closeModal();
      await loadPendingDocuments();
      setError('');
    } catch (err) {
      console.error(`Failed to ${modalType} document:`, err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || `Failed to ${modalType} document`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getChangeTypeBadge = (changeType?: string) => {
    if (!changeType) return null;
    const badges: { [key: string]: string } = {
      create: 'badge-create',
      update: 'badge-update',
      approve: 'badge-approve',
      obsolete: 'badge-obsolete',
      review: 'badge-review',
      version: 'badge-version',
    };
    return badges[changeType] || 'badge-default';
  };

  if (loading) {
    return <div className="loading">Loading pending documents...</div>;
  }

  return (
    <div className="pending-changes-page">
      <div className="page-header">
        <div>
          <h1>Pending Changes</h1>
          <p className="subtitle">Documents awaiting review and approval</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-value">{documents.length}</span>
            <span className="stat-label">Pending Reviews</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {documents.length === 0 ? (
        <div className="no-pending">
          <div className="no-pending-icon">✓</div>
          <h2>No Pending Changes</h2>
          <p>All documents have been reviewed. Great job!</p>
        </div>
      ) : (
        <div className="pending-documents-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="pending-document-card">
              <div className="card-header">
                <div className="document-title-section">
                  <h3 className="document-title">{doc.title}</h3>
                  <span className="document-version">v{doc.version}</span>
                </div>
                <span className="status-badge status-review">Under Review</span>
              </div>

              <div className="card-body">
                <div className="document-meta">
                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{doc.documentType}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Category:</span>
                    <span className="meta-value">{doc.category}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{formatDate(doc.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Updated:</span>
                    <span className="meta-value">{formatDate(doc.updatedAt)}</span>
                  </div>
                </div>

                {doc.description && (
                  <div className="document-description">
                    <p>{doc.description}</p>
                  </div>
                )}

                <div className="document-people">
                  <div className="people-item">
                    <span className="people-label">Created by:</span>
                    <span className="people-name">
                      {doc.creatorFirstName && doc.creatorLastName
                        ? `${doc.creatorFirstName} ${doc.creatorLastName}`
                        : doc.creatorEmail || 'Unknown'}
                    </span>
                  </div>
                  {doc.ownerFirstName && doc.ownerLastName && (
                    <div className="people-item">
                      <span className="people-label">Owner:</span>
                      <span className="people-name">
                        {doc.ownerFirstName} {doc.ownerLastName}
                      </span>
                    </div>
                  )}
                </div>

                {doc.latestRevisionNumber && (
                  <div className="revision-info">
                    <div className="revision-header">
                      <span className="revision-badge">
                        Revision #{doc.latestRevisionNumber}
                      </span>
                      {doc.latestChangeType && (
                        <span className={`change-type-badge ${getChangeTypeBadge(doc.latestChangeType)}`}>
                          {doc.latestChangeType}
                        </span>
                      )}
                    </div>
                    {doc.latestChangeDescription && (
                      <p className="revision-description">{doc.latestChangeDescription}</p>
                    )}
                    <div className="revision-meta">
                      <span className="revision-author">
                        {doc.latestRevisionAuthorFirstName && doc.latestRevisionAuthorLastName
                          ? `${doc.latestRevisionAuthorFirstName} ${doc.latestRevisionAuthorLastName}`
                          : 'Unknown'}
                      </span>
                      <span className="revision-date">{formatDateTime(doc.latestRevisionDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  View Details
                </button>
                <button
                  className="btn-success"
                  onClick={() => openModal('approve', doc)}
                  disabled={actionLoading === doc.id}
                >
                  {actionLoading === doc.id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="btn-warning"
                  onClick={() => openModal('request-changes', doc)}
                  disabled={actionLoading === doc.id}
                >
                  Request Changes
                </button>
                <button
                  className="btn-danger"
                  onClick={() => openModal('reject', doc)}
                  disabled={actionLoading === doc.id}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedDocument && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'approve' && 'Approve Document'}
                {modalType === 'reject' && 'Reject Document'}
                {modalType === 'request-changes' && 'Request Changes'}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-document-title">
                <strong>{selectedDocument.title}</strong> (v{selectedDocument.version})
              </p>
              <div className="modal-input-group">
                <label htmlFor="modal-input">
                  {modalType === 'approve' && 'Comments (optional):'}
                  {modalType === 'reject' && 'Rejection Reason (required):'}
                  {modalType === 'request-changes' && 'Change Request (required):'}
                </label>
                <textarea
                  id="modal-input"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder={
                    modalType === 'approve'
                      ? 'Add any comments about this approval...'
                      : modalType === 'reject'
                      ? 'Explain why this document is being rejected...'
                      : 'Describe the changes that need to be made...'
                  }
                  rows={5}
                  required={modalType !== 'approve'}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className={
                  modalType === 'approve'
                    ? 'btn-success'
                    : modalType === 'reject'
                    ? 'btn-danger'
                    : 'btn-warning'
                }
                onClick={handleAction}
                disabled={actionLoading !== null}
              >
                {actionLoading !== null ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingChanges;
