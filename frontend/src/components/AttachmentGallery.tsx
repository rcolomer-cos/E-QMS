import { useState, useEffect } from 'react';
import { Attachment, getAttachmentDownloadUrl, isImageFile, isPdfFile, formatFileSize, getFileTypeIcon } from '../services/attachmentService';
import '../styles/AttachmentGallery.css';

interface AttachmentGalleryProps {
  attachments: Attachment[];
  onDelete?: (id: number) => Promise<void>;
  canDelete?: boolean;
}

const AttachmentGallery = ({ attachments, onDelete, canDelete = false }: AttachmentGalleryProps) => {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAttachment(null);
      }
    };

    if (selectedAttachment) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedAttachment]);

  const handleDownload = (attachment: Attachment) => {
    const url = getAttachmentDownloadUrl(attachment.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.fileName;
    // Add authorization token to the request
    const token = localStorage.getItem('token');
    if (token) {
      link.setAttribute('data-token', token);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: number) => {
    if (!onDelete || !window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      setDeleting(id);
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (attachments.length === 0) {
    return (
      <div className="attachment-gallery-empty">
        <p>No attachments found</p>
      </div>
    );
  }

  return (
    <div className="attachment-gallery">
      <div className="attachment-grid">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment-card">
            <div 
              className="attachment-preview"
              onClick={() => setSelectedAttachment(attachment)}
            >
              {isImageFile(attachment.mimeType) ? (
                <img
                  src={getAttachmentDownloadUrl(attachment.id)}
                  alt={attachment.fileName}
                  className="attachment-thumbnail"
                  loading="lazy"
                />
              ) : (
                <div className="attachment-icon">
                  <span className="file-type-icon">
                    {getFileTypeIcon(attachment.mimeType, attachment.fileExtension)}
                  </span>
                  <span className="file-extension">
                    {attachment.fileExtension.toUpperCase().replace('.', '')}
                  </span>
                </div>
              )}
              <div className="attachment-overlay">
                <span>Click to view</span>
              </div>
            </div>
            
            <div className="attachment-info">
              <h4 className="attachment-filename" title={attachment.fileName}>
                {attachment.fileName}
              </h4>
              <p className="attachment-size">{formatFileSize(attachment.fileSize)}</p>
              {attachment.description && (
                <p className="attachment-description" title={attachment.description}>
                  {attachment.description}
                </p>
              )}
              <p className="attachment-date">
                Uploaded: {formatDate(attachment.createdAt)}
              </p>
            </div>

            <div className="attachment-actions">
              <button
                className="btn-download"
                onClick={() => handleDownload(attachment)}
                title="Download"
              >
                ⬇️ Download
              </button>
              {canDelete && (
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleting === attachment.id}
                  title="Delete"
                >
                  {deleting === attachment.id ? '⏳' : '🗑️'} Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing attachment */}
      {selectedAttachment && (
        <div 
          className="attachment-modal-overlay"
          onClick={() => setSelectedAttachment(null)}
        >
          <div 
            className="attachment-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{selectedAttachment.fileName}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedAttachment(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {isImageFile(selectedAttachment.mimeType) ? (
                <img
                  src={getAttachmentDownloadUrl(selectedAttachment.id)}
                  alt={selectedAttachment.fileName}
                  className="modal-image"
                />
              ) : isPdfFile(selectedAttachment.mimeType) ? (
                <iframe
                  src={getAttachmentDownloadUrl(selectedAttachment.id)}
                  className="modal-pdf"
                  title={selectedAttachment.fileName}
                />
              ) : (
                <div className="modal-file-preview">
                  <div className="file-icon-large">
                    {getFileTypeIcon(selectedAttachment.mimeType, selectedAttachment.fileExtension)}
                  </div>
                  <p>{selectedAttachment.fileName}</p>
                  <p className="file-size">
                    {formatFileSize(selectedAttachment.fileSize)}
                  </p>
                  <button
                    className="btn-download-large"
                    onClick={() => handleDownload(selectedAttachment)}
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedAttachment.description && (
                <p className="modal-description">
                  <strong>Description:</strong> {selectedAttachment.description}
                </p>
              )}
              <div className="modal-metadata">
                <span>Size: {formatFileSize(selectedAttachment.fileSize)}</span>
                <span>•</span>
                <span>Uploaded: {formatDate(selectedAttachment.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentGallery;
