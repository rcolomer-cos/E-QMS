import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, getDocumentVersionHistory, uploadDocumentFile } from '../services/documentService';
import { Document } from '../types';
import FileUpload from '../components/FileUpload';
import '../styles/DocumentView.css';

function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [versionHistory, setVersionHistory] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  useEffect(() => {
    if (id) {
      loadDocument(parseInt(id, 10));
    }
  }, [id]);

  const loadDocument = async (documentId: number) => {
    try {
      setLoading(true);
      const [docData, versions] = await Promise.all([
        getDocumentById(documentId),
        getDocumentVersionHistory(documentId),
      ]);
      setDocument(docData);
      setVersionHistory(versions);
      setError('');
    } catch (err) {
      console.error('Failed to load document:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleViewVersion = (versionId: number) => {
    navigate(`/documents/${versionId}`);
  };

  const handleFileUpload = async (file: File) => {
    if (!id) return;
    
    try {
      await uploadDocumentFile(parseInt(id, 10), file);
      // Reload document to show updated file information
      await loadDocument(parseInt(id, 10));
      setShowUploadSection(false);
    } catch (err) {
      console.error('Upload failed:', err);
      throw err; // Let FileUpload component handle the error display
    }
  };

  if (loading) {
    return <div className="loading">Loading document...</div>;
  }

  if (error || !document) {
    return (
      <div className="document-view-page">
        <div className="error-message">{error || 'Document not found'}</div>
        <button className="btn-back" onClick={() => navigate('/documents')}>
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="document-view-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/documents')}>
            ← Back to Documents
          </button>
          <h1>{document.title}</h1>
          <p className="subtitle">{document.description || 'No description provided'}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">Edit</button>
          <button className="btn-secondary">Create New Version</button>
          {!document.fileName && (
            <button 
              className="btn-primary" 
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              {showUploadSection ? 'Cancel Upload' : 'Upload File'}
            </button>
          )}
          {document.fileName && (
            <button className="btn-primary">Download</button>
          )}
        </div>
      </div>

      <div className="document-content">
        <div className="document-sections">
          {/* File Upload Section */}
          {showUploadSection && !document.fileName && (
            <section className="document-section upload-section">
              <h2>Upload Document File</h2>
              <p className="section-description">
                Upload a file to attach to this document. Once uploaded, the file information will be linked to this document record.
              </p>
              <FileUpload
                onFileSelect={() => {}}
                onUpload={handleFileUpload}
              />
            </section>
          )}

          {/* Metadata Section */}
          <section className="document-section">
            <h2>Document Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Document ID</label>
                <span>{document.id}</span>
              </div>
              <div className="info-item">
                <label>Version</label>
                <span className="version-badge">{document.version}</span>
              </div>
              <div className="info-item">
                <label>Status</label>
                <span className={`status-badge status-${document.status}`}>
                  {document.status}
                </span>
              </div>
              <div className="info-item">
                <label>Document Type</label>
                <span>{document.documentType}</span>
              </div>
              <div className="info-item">
                <label>Category</label>
                <span>{document.category}</span>
              </div>
              <div className="info-item">
                <label>Owner ID</label>
                <span>{document.ownerId || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* File Information Section */}
          {document.fileName && (
            <section className="document-section">
              <h2>File Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>File Name</label>
                  <span>{document.fileName}</span>
                </div>
                <div className="info-item">
                  <label>File Size</label>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
                <div className="info-item">
                  <label>File Path</label>
                  <span className="file-path">{document.filePath}</span>
                </div>
              </div>
            </section>
          )}

          {/* Dates Section */}
          <section className="document-section">
            <h2>Important Dates</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Created At</label>
                <span>{formatDateTime(document.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Updated At</label>
                <span>{formatDateTime(document.updatedAt)}</span>
              </div>
              <div className="info-item">
                <label>Effective Date</label>
                <span>{formatDate(document.effectiveDate)}</span>
              </div>
              <div className="info-item">
                <label>Review Date</label>
                <span>{formatDate(document.reviewDate)}</span>
              </div>
              <div className="info-item">
                <label>Expiry Date</label>
                <span>{formatDate(document.expiryDate)}</span>
              </div>
              <div className="info-item">
                <label>Approved At</label>
                <span>{formatDateTime(document.approvedAt)}</span>
              </div>
            </div>
          </section>

          {/* Approval Section */}
          <section className="document-section">
            <h2>Approval Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Created By (User ID)</label>
                <span>{document.createdBy}</span>
              </div>
              <div className="info-item">
                <label>Approved By (User ID)</label>
                <span>{document.approvedBy || 'Not approved yet'}</span>
              </div>
            </div>
          </section>

          {/* Version History Section */}
          <section className="document-section">
            <div className="section-header">
              <h2>Version History</h2>
              <button
                className="btn-toggle"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
              >
                {showVersionHistory ? 'Hide' : 'Show'} ({versionHistory.length} versions)
              </button>
            </div>
            
            {showVersionHistory && (
              <div className="version-history">
                {versionHistory.length === 0 ? (
                  <p className="no-data">No version history available</p>
                ) : (
                  <table className="version-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Created By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versionHistory.map((version) => (
                        <tr
                          key={version.id}
                          className={version.id === document.id ? 'current-version' : ''}
                        >
                          <td>
                            <span className="version-badge">{version.version}</span>
                            {version.id === document.id && (
                              <span className="current-label"> (Current)</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge status-${version.status}`}>
                              {version.status}
                            </span>
                          </td>
                          <td>{formatDateTime(version.createdAt)}</td>
                          <td>{version.createdBy}</td>
                          <td>
                            {version.id !== document.id && (
                              <button
                                className="btn-small"
                                onClick={() => handleViewVersion(version.id)}
                              >
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default DocumentView;
