import { useState, useEffect } from 'react';
import {
  getCAPAs,
  getCAPAsAssignedToMe,
  getOverdueCAPAs,
  updateCAPAStatus,
  completeCAPA,
  verifyCAPA,
  CAPA as CAPAType,
} from '../services/capaService';

type ViewMode = 'all' | 'assigned' | 'overdue';

function CAPA() {
  const [capas, setCapas] = useState<CAPAType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedCAPA, setSelectedCAPA] = useState<CAPAType | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Form states
  const [statusUpdate, setStatusUpdate] = useState<{
    status: 'open' | 'in_progress' | 'completed' | 'verified' | 'closed';
    notes: string;
  }>({
    status: 'open',
    notes: '',
  });
  const [completionData, setCompletionData] = useState({
    rootCause: '',
    proposedAction: '',
  });
  const [verificationData, setVerificationData] = useState({
    effectiveness: '',
  });

  useEffect(() => {
    loadCAPAs();
  }, [viewMode]);

  const loadCAPAs = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      
      if (viewMode === 'assigned') {
        response = await getCAPAsAssignedToMe();
        setCapas(response.data);
      } else if (viewMode === 'overdue') {
        response = await getOverdueCAPAs();
        setCapas(response.data);
      } else {
        const result = await getCAPAs();
        setCapas(result.data);
      }
    } catch (err) {
      setError('Failed to load CAPAs');
      console.error('Error loading CAPAs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedCAPA) return;

    try {
      await updateCAPAStatus(selectedCAPA.id, statusUpdate);
      setShowStatusModal(false);
      setSelectedCAPA(null);
      loadCAPAs();
    } catch (err) {
      alert('Failed to update CAPA status');
      console.error('Error updating status:', err);
    }
  };

  const handleComplete = async () => {
    if (!selectedCAPA) return;

    try {
      await completeCAPA(selectedCAPA.id, completionData);
      setShowCompleteModal(false);
      setSelectedCAPA(null);
      setCompletionData({ rootCause: '', proposedAction: '' });
      loadCAPAs();
    } catch (err) {
      alert('Failed to complete CAPA');
      console.error('Error completing CAPA:', err);
    }
  };

  const handleVerify = async () => {
    if (!selectedCAPA) return;

    try {
      await verifyCAPA(selectedCAPA.id, verificationData);
      setShowVerifyModal(false);
      setSelectedCAPA(null);
      setVerificationData({ effectiveness: '' });
      loadCAPAs();
    } catch (err) {
      alert('Failed to verify CAPA');
      console.error('Error verifying CAPA:', err);
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date();
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      open: 'status-open',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      verified: 'status-verified',
      closed: 'status-closed',
    };
    return statusMap[status] || 'status-open';
  };

  const getPriorityBadgeClass = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high',
      urgent: 'priority-urgent',
    };
    return priorityMap[priority] || 'priority-low';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Corrective and Preventive Actions (CAPA)</h1>
        <button className="btn-primary">Create CAPA</button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          className={viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setViewMode('all')}
        >
          All CAPAs
        </button>
        <button
          className={viewMode === 'assigned' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setViewMode('assigned')}
        >
          Assigned to Me
        </button>
        <button
          className={viewMode === 'overdue' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setViewMode('overdue')}
        >
          Overdue
        </button>
      </div>

      {loading && <p>Loading CAPAs...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>CAPA Number</th>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action Owner</th>
              <th>Target Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {capas.length === 0 ? (
              <tr>
                <td colSpan={8}>No CAPAs found</td>
              </tr>
            ) : (
              capas.map((capa) => (
                <tr key={capa.id} className={isOverdue(capa.targetDate) && capa.status !== 'closed' ? 'overdue-row' : ''}>
                  <td>{capa.capaNumber}</td>
                  <td>{capa.title}</td>
                  <td style={{ textTransform: 'capitalize' }}>{capa.type}</td>
                  <td>
                    <span className={`badge ${getPriorityBadgeClass(capa.priority)}`}>
                      {capa.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(capa.status)}`}>
                      {capa.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{capa.actionOwnerName || `User ${capa.actionOwner}`}</td>
                  <td>
                    {new Date(capa.targetDate).toLocaleDateString()}
                    {isOverdue(capa.targetDate) && capa.status !== 'closed' && (
                      <span style={{ color: 'red', marginLeft: '5px', fontWeight: 'bold' }}>⚠ OVERDUE</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn-small"
                      onClick={() => {
                        setSelectedCAPA(capa);
                        setStatusUpdate({ status: capa.status, notes: '' });
                        setShowStatusModal(true);
                      }}
                    >
                      Update Status
                    </button>
                    {capa.status === 'in_progress' && (
                      <button 
                        className="btn-small"
                        onClick={() => {
                          setSelectedCAPA(capa);
                          setCompletionData({
                            rootCause: capa.rootCause || '',
                            proposedAction: capa.proposedAction || '',
                          });
                          setShowCompleteModal(true);
                        }}
                      >
                        Complete
                      </button>
                    )}
                    {capa.status === 'completed' && (
                      <button 
                        className="btn-small"
                        onClick={() => {
                          setSelectedCAPA(capa);
                          setVerificationData({ effectiveness: '' });
                          setShowVerifyModal(true);
                        }}
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedCAPA && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Update CAPA Status</h2>
            <p><strong>CAPA:</strong> {selectedCAPA.capaNumber} - {selectedCAPA.title}</p>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value as any })}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes (optional):</label>
              <textarea
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleStatusUpdate}>Update</button>
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete CAPA Modal */}
      {showCompleteModal && selectedCAPA && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Complete CAPA</h2>
            <p><strong>CAPA:</strong> {selectedCAPA.capaNumber} - {selectedCAPA.title}</p>
            <div className="form-group">
              <label>Root Cause:</label>
              <textarea
                value={completionData.rootCause}
                onChange={(e) => setCompletionData({ ...completionData, rootCause: e.target.value })}
                rows={4}
                placeholder="Describe the root cause analysis..."
              />
            </div>
            <div className="form-group">
              <label>Proposed Action:</label>
              <textarea
                value={completionData.proposedAction}
                onChange={(e) => setCompletionData({ ...completionData, proposedAction: e.target.value })}
                rows={4}
                placeholder="Describe the corrective/preventive action taken..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleComplete}>Complete</button>
              <button className="btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Verify CAPA Modal */}
      {showVerifyModal && selectedCAPA && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Verify CAPA Effectiveness</h2>
            <p><strong>CAPA:</strong> {selectedCAPA.capaNumber} - {selectedCAPA.title}</p>
            <div className="form-group">
              <label>Effectiveness Verification:</label>
              <textarea
                value={verificationData.effectiveness}
                onChange={(e) => setVerificationData({ effectiveness: e.target.value })}
                rows={6}
                placeholder="Describe the effectiveness of the action taken..."
                required
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={handleVerify}
                disabled={!verificationData.effectiveness.trim()}
              >
                Verify
              </button>
              <button className="btn-secondary" onClick={() => setShowVerifyModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .overdue-row {
          background-color: #fff3cd;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-open {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        .status-in-progress {
          background-color: #fff3e0;
          color: #f57c00;
        }
        .status-completed {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }
        .status-verified {
          background-color: #e8f5e9;
          color: #388e3c;
        }
        .status-closed {
          background-color: #f5f5f5;
          color: #616161;
        }
        .priority-low {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .priority-medium {
          background-color: #fff3e0;
          color: #f57c00;
        }
        .priority-high {
          background-color: #ffe0b2;
          color: #e65100;
        }
        .priority-urgent {
          background-color: #ffebee;
          color: #c62828;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: white;
          padding: 24px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal h2 {
          margin-top: 0;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .btn-secondary {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        .error {
          color: #c62828;
          padding: 10px;
          background-color: #ffebee;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default CAPA;
