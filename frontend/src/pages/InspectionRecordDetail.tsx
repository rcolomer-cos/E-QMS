import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspectionRecordById, InspectionRecord, createNCRFromInspection } from '../services/inspectionRecordService';
import { getEquipmentById, Equipment } from '../services/equipmentService';
import { getAttachmentsByEntity, Attachment, getAttachmentDownloadUrl } from '../services/attachmentService';
import { getNCRsByInspectionRecord } from '../services/ncrService';
import { NCR } from '../types';
import '../styles/RecordDetail.css';

function InspectionRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkedNCRs, setLinkedNCRs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showNCRModal, setShowNCRModal] = useState(false);
  const [creatingNCR, setCreatingNCR] = useState(false);
  const [ncrError, setNcrError] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const recordData = await getInspectionRecordById(parseInt(id!));
      setRecord(recordData);
      
      if (recordData.equipmentId) {
        const equipmentData = await getEquipmentById(recordData.equipmentId);
        setEquipment(equipmentData);
      }

      // Load attachments
      try {
        const attachmentData = await getAttachmentsByEntity('inspection', parseInt(id!));
        setAttachments(attachmentData.data);
      } catch (err) {
        console.error('Failed to load attachments:', err);
      }

      // Load linked NCRs
      try {
        const ncrData = await getNCRsByInspectionRecord(parseInt(id!));
        setLinkedNCRs(ncrData.data);
      } catch (err) {
        console.error('Failed to load linked NCRs:', err);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inspection record');
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'tw-badge tw-badge-success';
      case 'in_progress':
        return 'tw-badge tw-badge-warning';
      case 'scheduled':
        return 'tw-badge tw-badge-info';
      case 'overdue':
        return 'tw-badge tw-badge-danger';
      case 'cancelled':
        return 'tw-badge tw-badge-secondary';
      default:
        return 'tw-badge tw-badge-secondary';
    }
  };

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'passed':
        return 'tw-badge tw-badge-success';
      case 'passed_with_observations':
        return 'tw-badge tw-badge-info';
      case 'failed':
        return 'tw-badge tw-badge-danger';
      case 'conditional':
        return 'tw-badge tw-badge-warning';
      case 'pending':
        return 'tw-badge tw-badge-secondary';
      default:
        return 'tw-badge tw-badge-secondary';
    }
  };

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'tw-badge tw-badge-danger';
      case 'major':
        return 'tw-badge tw-badge-warning';
      case 'moderate':
        return 'tw-badge tw-badge-info';
      case 'minor':
        return 'tw-badge tw-badge-secondary';
      case 'none':
        return 'tw-badge tw-badge-success';
      default:
        return 'tw-badge tw-badge-secondary';
    }
  };

  const handleCreateNCR = async () => {
    if (!id) return;

    try {
      setCreatingNCR(true);
      setNcrError('');
      
      const result = await createNCRFromInspection(parseInt(id));
      
      // Reload the inspection record data to show the newly created NCR
      await loadData();
      
      // Close modal and navigate to the new NCR
      setShowNCRModal(false);
      alert(`NCR ${result.ncrNumber} created successfully!`);
      navigate(`/ncrs/${result.id}`);
    } catch (err: any) {
      setNcrError(err.response?.data?.error || 'Failed to create NCR');
    } finally {
      setCreatingNCR(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading inspection record...</div>;
  }

  if (error || !record) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">{error || 'Record not found'}</div>
        <button onClick={() => navigate('/inspection-records')} className="tw-btn tw-btn-secondary">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="record-detail-page">
      <div className="page-header">
        <div>
          <h1>Inspection Record Details</h1>
          <p className="record-id">Record ID: {record.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(record.result === 'failed' || !record.passed) && linkedNCRs.length === 0 && (
            <button 
              onClick={() => setShowNCRModal(true)} 
              className="tw-btn tw-btn-danger"
              title="Create Non-Conformance Report from this failed inspection"
            >
              Create NCR
            </button>
          )}
          <button onClick={() => navigate('/inspection-records')} className="tw-btn tw-btn-secondary">
            Back to List
          </button>
        </div>
      </div>

      <div className="detail-sections">
        {/* Equipment Information */}
        <section className="detail-section">
          <h2>Equipment Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Equipment Number:</label>
              <span>{equipment?.equipmentNumber || record.equipmentNumber || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Equipment Name:</label>
              <span>{equipment?.name || record.equipmentName || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Location:</label>
              <span>{equipment?.location || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Department:</label>
              <span>{equipment?.department || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Inspection Details */}
        <section className="detail-section">
          <h2>Inspection Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Inspection Date:</label>
              <span>{formatDate(record.inspectionDate)}</span>
            </div>
            <div className="detail-item">
              <label>Due Date:</label>
              <span>{formatDate(record.dueDate)}</span>
            </div>
            <div className="detail-item">
              <label>Next Due Date:</label>
              <span>{formatDate(record.nextDueDate)}</span>
            </div>
            <div className="detail-item">
              <label>Inspection Type:</label>
              <span>{record.inspectionType}</span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={getStatusBadgeClass(record.status)}>
                {record.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="detail-item">
              <label>Result:</label>
              <span className={getResultBadgeClass(record.result)}>
                {record.result.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="detail-item">
              <label>Severity:</label>
              {record.severity ? (
                <span className={getSeverityBadgeClass(record.severity)}>
                  {record.severity.toUpperCase()}
                </span>
              ) : (
                <span>N/A</span>
              )}
            </div>
            <div className="detail-item">
              <label>Duration (minutes):</label>
              <span>{record.duration || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Inspection Results */}
        <section className="detail-section">
          <h2>Inspection Results</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Passed:</label>
              <span className={record.passed ? 'tw-badge tw-badge-success' : 'tw-badge tw-badge-danger'}>
                {record.passed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="detail-item">
              <label>Safety Compliant:</label>
              <span className={record.safetyCompliant ? 'tw-badge tw-badge-success' : 'tw-badge tw-badge-danger'}>
                {record.safetyCompliant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="detail-item">
              <label>Operational Compliant:</label>
              <span className={record.operationalCompliant ? 'tw-badge tw-badge-success' : 'tw-badge tw-badge-danger'}>
                {record.operationalCompliant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="detail-item">
              <label>Follow-up Required:</label>
              <span className={record.followUpRequired ? 'tw-badge tw-badge-warning' : 'tw-badge tw-badge-success'}>
                {record.followUpRequired ? 'Yes' : 'No'}
              </span>
            </div>
            {record.followUpRequired && record.followUpDate && (
              <div className="detail-item">
                <label>Follow-up Date:</label>
                <span>{formatDate(record.followUpDate)}</span>
              </div>
            )}
          </div>
          {record.findings && (
            <div className="detail-item full-width">
              <label>Findings:</label>
              <div className="detail-text">{record.findings}</div>
            </div>
          )}
          {record.defectsFound && (
            <div className="detail-item full-width">
              <label>Defects Found:</label>
              <div className="detail-text">{record.defectsFound}</div>
            </div>
          )}
          {record.correctiveAction && (
            <div className="detail-item full-width">
              <label>Corrective Action:</label>
              <div className="detail-text">{record.correctiveAction}</div>
            </div>
          )}
          {record.recommendedAction && (
            <div className="detail-item full-width">
              <label>Recommended Action:</label>
              <div className="detail-text">{record.recommendedAction}</div>
            </div>
          )}
        </section>

        {/* Measurements & Parameters */}
        {(record.measurementsTaken || record.parameters) && (
          <section className="detail-section">
            <h2>Measurements & Parameters</h2>
            {record.measurementsTaken && (
              <div className="detail-item full-width">
                <label>Measurements Taken:</label>
                <div className="detail-text">{record.measurementsTaken}</div>
              </div>
            )}
            {record.parameters && (
              <div className="detail-item full-width">
                <label>Parameters:</label>
                <div className="detail-text">{record.parameters}</div>
              </div>
            )}
          </section>
        )}

        {/* Checklist */}
        {record.inspectionChecklist && (
          <section className="detail-section">
            <h2>Inspection Checklist</h2>
            <div className="detail-text">{record.inspectionChecklist}</div>
          </section>
        )}

        {/* Personnel */}
        <section className="detail-section">
          <h2>Personnel</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Inspected By:</label>
              <span>{record.inspectedByName || `User ID: ${record.inspectedBy}`}</span>
            </div>
            <div className="detail-item">
              <label>Reviewed By:</label>
              <span>{record.reviewedByName || (record.reviewedBy ? `User ID: ${record.reviewedBy}` : 'N/A')}</span>
            </div>
          </div>
        </section>

        {/* Notes */}
        {record.notes && (
          <section className="detail-section">
            <h2>Additional Notes</h2>
            <div className="detail-text">{record.notes}</div>
          </section>
        )}

        {/* Inspection Photos */}
        {attachments.length > 0 && (
          <section className="detail-section">
            <h2>Inspection Photos</h2>
            <div className="inspection-photos-grid">
              {attachments
                .filter(att => att.category === 'inspection_photo')
                .map((attachment) => (
                  <div
                    key={attachment.id}
                    className="photo-thumbnail"
                    onClick={() => setSelectedImage(getAttachmentDownloadUrl(attachment.id))}
                  >
                    <img
                      src={getAttachmentDownloadUrl(attachment.id)}
                      alt={attachment.description || 'Inspection photo'}
                      loading="lazy"
                    />
                    <div className="photo-info">
                      <span className="photo-size">
                        {(attachment.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Attachments */}
        {record.attachments && (
          <section className="detail-section">
            <h2>Attachments</h2>
            <div className="attachments-list">
              <p>{record.attachments}</p>
            </div>
          </section>
        )}

        {/* Linked NCRs */}
        {linkedNCRs.length > 0 && (
          <section className="detail-section">
            <h2>Linked Non-Conformance Reports</h2>
            <div className="ncr-list">
              {linkedNCRs.map((ncr) => (
                <div key={ncr.id} className="ncr-item" style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: '#f8f9fa'
                }}
                onClick={() => navigate(`/ncrs/${ncr.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{ncr.ncrNumber}</strong> - {ncr.title}
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                        {ncr.description.substring(0, 150)}...
                      </div>
                    </div>
                    <span className={`${
                      ncr.status === 'closed' ? 'tw-badge tw-badge-success' : 
                      ncr.status === 'in_progress' ? 'tw-badge tw-badge-warning' : 
                      'tw-badge tw-badge-danger'
                    }`}>
                      {ncr.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Revision History */}
        <section className="detail-section">
          <h2>Revision History</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created At:</label>
              <span>{formatDateTime(record.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span>{formatDateTime(record.updatedAt)}</span>
            </div>
            <div className="detail-item">
              <label>Created By:</label>
              <span>{record.createdBy ? `User ID: ${record.createdBy}` : 'N/A'}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedImage(null)}>
              ✕
            </button>
            <img src={selectedImage} alt="Full size inspection photo" />
          </div>
        </div>
      )}

      {/* NCR Creation Modal */}
      {showNCRModal && (
        <div className="modal-overlay" onClick={() => setShowNCRModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2>Create NCR from Inspection</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              This will create a Non-Conformance Report pre-filled with information from this failed inspection.
            </p>

            {ncrError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {ncrError}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <p><strong>Inspection Type:</strong> {record.inspectionType}</p>
              <p><strong>Equipment:</strong> {equipment?.name || 'N/A'} ({equipment?.equipmentNumber || 'N/A'})</p>
              <p><strong>Inspection Date:</strong> {formatDate(record.inspectionDate)}</p>
              <p><strong>Severity:</strong> {record.severity || 'N/A'}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowNCRModal(false)} 
                className="tw-btn tw-btn-secondary"
                disabled={creatingNCR}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateNCR} 
                className="tw-btn tw-btn-danger"
                disabled={creatingNCR}
              >
                {creatingNCR ? 'Creating NCR...' : 'Create NCR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InspectionRecordDetail;
