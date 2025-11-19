import React, { useState } from 'react';
import { acknowledgeDocument } from '../services/documentService';
import '../styles/Modal.css';

interface ComplianceAcknowledgementModalProps {
  open: boolean;
  documentId: number;
  documentTitle: string;
  documentVersion: string;
  onAcknowledge: () => void;
  onClose?: () => void;
}

const ComplianceAcknowledgementModal: React.FC<ComplianceAcknowledgementModalProps> = ({
  open,
  documentId,
  documentTitle,
  documentVersion,
  onAcknowledge,
  onClose,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcknowledge = async () => {
    if (!confirmed) {
      setError('Please confirm that you have read and understood this document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await acknowledgeDocument(documentId);
      onAcknowledge();
    } catch (err: any) {
      console.error('Failed to acknowledge document:', err);
      setError(err.response?.data?.error || 'Failed to record acknowledgement. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose ? handleClose : undefined}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✓ Compliance Acknowledgement Required</h2>
        </div>
        <div className="modal-content">
          <div className="modal-section">
            <p>
              This document requires your acknowledgement to confirm you have read and understood its contents.
            </p>
            <div className="document-info-box">
              <div className="info-label">Document:</div>
              <div className="info-value">{documentTitle}</div>
              <div className="info-label">Version:</div>
              <div className="info-value">{documentVersion}</div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="checkbox-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setConfirmed(e.target.checked);
                  if (error) setError(null);
                }}
                className="checkbox-input"
              />
              <span>I confirm that I have read and understood this document and its requirements.</span>
            </label>
          </div>

          <div className="alert alert-info">
            <strong>Note:</strong> Your acknowledgement will be recorded with a timestamp for compliance tracking purposes.
            If this document is updated to a new version, you will need to acknowledge it again.
          </div>
        </div>
        <div className="modal-footer">
          {onClose && (
            <button 
              className="btn-secondary" 
              onClick={handleClose} 
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            className="btn-primary"
            onClick={handleAcknowledge}
            disabled={!confirmed || loading}
          >
            {loading ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAcknowledgementModal;
