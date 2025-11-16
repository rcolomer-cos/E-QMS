import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCAPAs,
  getCAPAsAssignedToMe,
  getOverdueCAPAs,
  createCAPA,
  CreateCAPAData,
  CAPA as CAPAType,
} from '../services/capaService';
import { getUsers } from '../services/userService';
import { User } from '../types';
import CAPAForm from '../components/CAPAForm';

type ViewMode = 'all' | 'assigned' | 'overdue';

function CAPA() {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<CAPAType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [viewMode]);

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
    try {
      setLoading(true);
      setError(null);
      let capaResponse;
      
      if (viewMode === 'assigned') {
        capaResponse = await getCAPAsAssignedToMe();
        setCapas(capaResponse.data);
      } else if (viewMode === 'overdue') {
        capaResponse = await getOverdueCAPAs();
        setCapas(capaResponse.data);
      } else {
        const result = await getCAPAs();
        setCapas(result.data);
      }

      // Load users for form
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load CAPAs');
      console.error('Error loading CAPAs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCAPA = async (data: CreateCAPAData) => {
    try {
      await createCAPA(data);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to create CAPA');
      throw err;
    }
  };

  const handleViewCAPA = (capaId: number) => {
    navigate(`/capa/${capaId}`);
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

  const canCreateCAPA = () => {
    if (!currentUser) return false;
    return ['admin', 'manager', 'auditor'].includes(currentUser.role.toLowerCase());
  };

  if (showCreateForm) {
    return (
      <div className="page">
        <CAPAForm
          onSubmit={handleCreateCAPA}
          onCancel={() => setShowCreateForm(false)}
          users={users}
          currentUserId={currentUser?.id || 0}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Corrective and Preventive Actions (CAPA)</h1>
        {canCreateCAPA() && (
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            Create CAPA
          </button>
        )}
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
                      onClick={() => handleViewCAPA(capa.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
