import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceRecordById, ServiceMaintenanceRecord } from '../services/serviceRecordService';
import { getEquipmentById, Equipment } from '../services/equipmentService';
import '../styles/RecordDetail.css';

function ServiceRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ServiceMaintenanceRecord | null>(null);
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
      const recordData = await getServiceRecordById(parseInt(id!));
      setRecord(recordData);
      
      if (recordData.equipmentId) {
        const equipmentData = await getEquipmentById(recordData.equipmentId);
        setEquipment(equipmentData);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load service record');
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

  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A';
    return `$${cost.toFixed(2)}`;
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
      case 'on_hold':
        return 'badge badge-warning';
      default:
        return 'badge';
    }
  };

  const getServiceTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'badge badge-success';
      case 'corrective':
        return 'badge badge-warning';
      case 'emergency':
        return 'badge badge-danger';
      case 'breakdown':
        return 'badge badge-danger';
      case 'predictive':
        return 'badge badge-info';
      default:
        return 'badge badge-secondary';
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'emergency':
        return 'badge badge-danger';
      case 'urgent':
        return 'badge badge-warning';
      case 'high':
        return 'badge badge-info';
      case 'normal':
        return 'badge badge-secondary';
      case 'low':
        return 'badge badge-secondary';
      default:
        return 'badge';
    }
  };

  if (loading) {
    return <div className="loading">Loading service record...</div>;
  }

  if (error || !record) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">{error || 'Record not found'}</div>
        <button onClick={() => navigate('/service-records')} className="tw-btn tw-btn-secondary">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="record-detail-page">
      <div className="page-header">
        <div>
          <h1>Service & Maintenance Record Details</h1>
          <p className="record-id">Record ID: {record.id}</p>
        </div>
        <button onClick={() => navigate('/service-records')} className="tw-btn tw-btn-secondary">
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

        {/* Service Details */}
        <section className="detail-section">
          <h2>Service Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Service Date:</label>
              <span>{formatDate(record.serviceDate)}</span>
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
              <label>Work Order Number:</label>
              <span>{record.workOrderNumber || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Service Type:</label>
              <span className={getServiceTypeBadgeClass(record.serviceType)}>
                {record.serviceType.toUpperCase()}
              </span>
            </div>
            <div className="detail-item">
              <label>Priority:</label>
              {record.priority ? (
                <span className={getPriorityBadgeClass(record.priority)}>
                  {record.priority.toUpperCase()}
                </span>
              ) : (
                <span>N/A</span>
              )}
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={getStatusBadgeClass(record.status)}>
                {record.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="detail-item">
              <label>Outcome:</label>
              <span>{record.outcome.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <div className="detail-item full-width">
            <label>Description:</label>
            <div className="detail-text">{record.description}</div>
          </div>
        </section>

        {/* Work Performed */}
        <section className="detail-section">
          <h2>Work Performed</h2>
          {record.workPerformed && (
            <div className="detail-item full-width">
              <label>Work Performed:</label>
              <div className="detail-text">{record.workPerformed}</div>
            </div>
          )}
          <div className="detail-grid">
            <div className="detail-item">
              <label>Hours Spent:</label>
              <span>{record.hoursSpent || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Equipment Condition:</label>
              <span>{record.equipmentCondition?.toUpperCase() || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Parts & Materials */}
        {(record.partsUsed || record.partsReplaced) && (
          <section className="detail-section">
            <h2>Parts & Materials</h2>
            {record.partsUsed && (
              <div className="detail-item full-width">
                <label>Parts Used:</label>
                <div className="detail-text">{record.partsUsed}</div>
              </div>
            )}
            {record.partsReplaced && (
              <div className="detail-item full-width">
                <label>Parts Replaced:</label>
                <div className="detail-text">{record.partsReplaced}</div>
              </div>
            )}
          </section>
        )}

        {/* Cost Information */}
        <section className="detail-section">
          <h2>Cost Information</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Materials Cost:</label>
              <span>{formatCost(record.materialsCost)}</span>
            </div>
            <div className="detail-item">
              <label>Labor Cost:</label>
              <span>{formatCost(record.laborCost)}</span>
            </div>
            <div className="detail-item">
              <label>Total Cost:</label>
              <span className="cost-total">{formatCost(record.totalCost)}</span>
            </div>
            <div className="detail-item">
              <label>Invoice Number:</label>
              <span>{record.invoiceNumber || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* External Provider */}
        {(record.externalProvider || record.providerContact) && (
          <section className="detail-section">
            <h2>External Provider</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Provider:</label>
                <span>{record.externalProvider || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Provider Contact:</label>
                <span>{record.providerContact || 'N/A'}</span>
              </div>
            </div>
          </section>
        )}

        {/* Issues & Actions */}
        <section className="detail-section">
          <h2>Issues & Actions</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Issues Resolved:</label>
              <span className={record.issuesResolved ? 'badge badge-success' : 'badge badge-danger'}>
                {record.issuesResolved ? 'Yes' : 'No'}
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
          {record.problemsIdentified && (
            <div className="detail-item full-width">
              <label>Problems Identified:</label>
              <div className="detail-text">{record.problemsIdentified}</div>
            </div>
          )}
          {record.rootCause && (
            <div className="detail-item full-width">
              <label>Root Cause:</label>
              <div className="detail-text">{record.rootCause}</div>
            </div>
          )}
          {record.preventiveActions && (
            <div className="detail-item full-width">
              <label>Preventive Actions:</label>
              <div className="detail-text">{record.preventiveActions}</div>
            </div>
          )}
          {record.recommendations && (
            <div className="detail-item full-width">
              <label>Recommendations:</label>
              <div className="detail-text">{record.recommendations}</div>
            </div>
          )}
        </section>

        {/* Testing */}
        {(record.functionalTestPerformed || record.testResults) && (
          <section className="detail-section">
            <h2>Testing</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Functional Test Performed:</label>
                <span className={record.functionalTestPerformed ? 'badge badge-success' : 'badge badge-secondary'}>
                  {record.functionalTestPerformed ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            {record.testResults && (
              <div className="detail-item full-width">
                <label>Test Results:</label>
                <div className="detail-text">{record.testResults}</div>
              </div>
            )}
          </section>
        )}

        {/* Downtime */}
        {(record.downtimeStart || record.downtimeEnd || record.downtimeHours) && (
          <section className="detail-section">
            <h2>Downtime</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Downtime Start:</label>
                <span>{formatDateTime(record.downtimeStart)}</span>
              </div>
              <div className="detail-item">
                <label>Downtime End:</label>
                <span>{formatDateTime(record.downtimeEnd)}</span>
              </div>
              <div className="detail-item">
                <label>Total Downtime (hours):</label>
                <span>{record.downtimeHours || 'N/A'}</span>
              </div>
            </div>
          </section>
        )}

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

export default ServiceRecordDetail;
