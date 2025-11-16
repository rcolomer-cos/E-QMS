import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspectionRecordById, InspectionRecord } from '../services/inspectionRecordService';
import { getEquipmentById, Equipment } from '../services/equipmentService';
import '../styles/RecordDetail.css';

function InspectionRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        return 'badge badge-success';
      case 'in_progress':
        return 'badge badge-warning';
      case 'scheduled':
        return 'badge badge-info';
      case 'overdue':
        return 'badge badge-danger';
      case 'cancelled':
        return 'badge badge-secondary';
      default:
        return 'badge';
    }
  };

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'passed':
        return 'badge badge-success';
      case 'passed_with_observations':
        return 'badge badge-info';
      case 'failed':
        return 'badge badge-danger';
      case 'conditional':
        return 'badge badge-warning';
      case 'pending':
        return 'badge badge-secondary';
      default:
        return 'badge';
    }
  };

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'badge badge-danger';
      case 'major':
        return 'badge badge-warning';
      case 'moderate':
        return 'badge badge-info';
      case 'minor':
        return 'badge badge-secondary';
      case 'none':
        return 'badge badge-success';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return <div className="loading">Loading inspection record...</div>;
  }

  if (error || !record) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">{error || 'Record not found'}</div>
        <button onClick={() => navigate('/inspection-records')} className="btn btn-secondary">
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
        <button onClick={() => navigate('/inspection-records')} className="btn btn-secondary">
          Back to List
        </button>
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
              <span className={record.passed ? 'badge badge-success' : 'badge badge-danger'}>
                {record.passed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="detail-item">
              <label>Safety Compliant:</label>
              <span className={record.safetyCompliant ? 'badge badge-success' : 'badge badge-danger'}>
                {record.safetyCompliant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="detail-item">
              <label>Operational Compliant:</label>
              <span className={record.operationalCompliant ? 'badge badge-success' : 'badge badge-danger'}>
                {record.operationalCompliant ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="detail-item">
              <label>Follow-up Required:</label>
              <span className={record.followUpRequired ? 'badge badge-warning' : 'badge badge-success'}>
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

        {/* Attachments */}
        {record.attachments && (
          <section className="detail-section">
            <h2>Attachments</h2>
            <div className="attachments-list">
              <p>{record.attachments}</p>
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
    </div>
  );
}

export default InspectionRecordDetail;
