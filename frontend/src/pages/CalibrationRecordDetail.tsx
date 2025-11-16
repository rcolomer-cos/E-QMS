import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCalibrationRecordById, CalibrationRecord } from '../services/calibrationRecordService';
import { getEquipmentById, Equipment } from '../services/equipmentService';
import '../styles/RecordDetail.css';

function CalibrationRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CalibrationRecord | null>(null);
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
      const recordData = await getCalibrationRecordById(parseInt(id!));
      setRecord(recordData);
      
      if (recordData.equipmentId) {
        const equipmentData = await getEquipmentById(recordData.equipmentId);
        setEquipment(equipmentData);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load calibration record');
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

  if (loading) {
    return <div className="loading">Loading calibration record...</div>;
  }

  if (error || !record) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">{error || 'Record not found'}</div>
        <button onClick={() => navigate('/calibration-records')} className="btn btn-secondary">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="record-detail-page">
      <div className="page-header">
        <div>
          <h1>Calibration Record Details</h1>
          <p className="record-id">Record ID: {record.id}</p>
        </div>
        <button onClick={() => navigate('/calibration-records')} className="btn btn-secondary">
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

        {/* Calibration Details */}
        <section className="detail-section">
          <h2>Calibration Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Calibration Date:</label>
              <span>{formatDate(record.calibrationDate)}</span>
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
              <label>Calibration Type:</label>
              <span>{record.calibrationType || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Calibration Standard:</label>
              <span>{record.calibrationStandard || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Certificate Number:</label>
              <span>{record.certificateNumber || 'N/A'}</span>
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
                {record.result.toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        {/* Test Results */}
        <section className="detail-section">
          <h2>Test Results</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Result Value:</label>
              <span>{record.resultValue || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Tolerance Min:</label>
              <span>{record.toleranceMin || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Tolerance Max:</label>
              <span>{record.toleranceMax || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Passed:</label>
              <span className={record.passed ? 'badge badge-success' : 'badge badge-danger'}>
                {record.passed ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          {record.findings && (
            <div className="detail-item full-width">
              <label>Findings:</label>
              <div className="detail-text">{record.findings}</div>
            </div>
          )}
          {record.correctiveAction && (
            <div className="detail-item full-width">
              <label>Corrective Action:</label>
              <div className="detail-text">{record.correctiveAction}</div>
            </div>
          )}
        </section>

        {/* Personnel */}
        <section className="detail-section">
          <h2>Personnel</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Performed By:</label>
              <span>{record.performedByName || `User ID: ${record.performedBy}`}</span>
            </div>
            <div className="detail-item">
              <label>Approved By:</label>
              <span>{record.approvedByName || (record.approvedBy ? `User ID: ${record.approvedBy}` : 'N/A')}</span>
            </div>
          </div>
        </section>

        {/* External Provider Information */}
        {(record.externalProvider || record.providerCertification || record.cost) && (
          <section className="detail-section">
            <h2>External Provider</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Provider:</label>
                <span>{record.externalProvider || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Provider Certification:</label>
                <span>{record.providerCertification || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Cost:</label>
                <span>{record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}</span>
              </div>
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

export default CalibrationRecordDetail;
