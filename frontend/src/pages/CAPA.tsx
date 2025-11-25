import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '../services/authService';
import {
  getCAPAs,
  getCAPAsAssignedToMe,
  getOverdueCAPAs,
  createCAPA,
  CreateCAPAData,
  CAPA as CAPAType,
} from '../services/capaService';
import { getUsers } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import CAPAForm from '../components/CAPAForm';

type ViewMode = 'all' | 'assigned' | 'overdue';

function CAPA() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  const hasRole = (roleNames: string[]) => {
    if (!currentUser) return false;
    // Check roleNames array first (preferred)
    const userRoles = currentUser.roleNames || [];
    if (userRoles.length > 0) {
      return roleNames.some(role => userRoles.includes(role));
    }
    // Fallback: check roles array and extract names
    if (currentUser.roles && currentUser.roles.length > 0) {
      const roleNamesFromRoles = currentUser.roles.map(r => r.name.toLowerCase());
      return roleNames.some(role => roleNamesFromRoles.includes(role.toLowerCase()));
    }
    // Legacy fallback: check single role property
    if (currentUser.role) {
      return roleNames.some(role => role.toLowerCase() === currentUser.role?.toLowerCase());
    }
    return false;
  };

  const canEdit = hasRole(['superuser', 'admin', 'manager', 'auditor']);

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
      const errorMsg = 'Failed to load CAPAs';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error loading CAPAs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCAPA = async (data: CreateCAPAData) => {
    try {
      await createCAPA(data);
      toast.showCreateSuccess('CAPA');
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMsg = error.response?.data?.error || 'Failed to create CAPA';
      setError(errorMsg);
      toast.error(errorMsg);
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

  const canCreateCAPA = hasRole(['superuser', 'admin', 'manager', 'auditor']);

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
        <h1>{t('capa.fullTitle')}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => navigate('/capa/dashboard')}>
            {t('capa.dashboard')}
          </button>
          {canCreateCAPA && (
            <button className="btn-primary" onClick={() => navigate('/capa/add')}>
              {t('capa.createCAPA')}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          className={viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setViewMode('all')}
        >
          {t('capa.allCAPAs')}
        </button>
        <button
          className={viewMode === 'assigned' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setViewMode('assigned')}
        >
          {t('common.assignedToMe')}
        </button>
        <button
          className={viewMode === 'overdue' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setViewMode('overdue')}
        >
          {t('capa.overdueItems')}
        </button>
      </div>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('capa.capaNumber')}</th>
              <th>{t('capa.capaTitle')}</th>
              <th>{t('capa.capaType')}</th>
              <th>{t('capa.linkedNCR')}</th>
              <th>{t('capa.priority')}</th>
              <th>{t('capa.capaStatus')}</th>
              <th>{t('capa.actionOwner')}</th>
              <th>{t('capa.targetDate')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {capas.length === 0 ? (
              <tr>
                <td colSpan={9}>{t('messages.noData')}</td>
              </tr>
            ) : (
              capas.map((capa) => (
                <tr key={capa.id} className={isOverdue(capa.targetDate) && capa.status !== 'closed' ? 'overdue-row' : ''}>
                  <td>{capa.capaNumber}</td>
                  <td>{capa.title}</td>
                  <td>{t(`capa.types.${capa.type}`)}</td>
                  <td>
                    {capa.ncrId ? (
                      <button
                        className="tw-btn-link"
                        onClick={() => navigate(`/ncr/${capa.ncrId}`)}
                        style={{
                          color: '#3498db',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          font: 'inherit'
                        }}
                      >
                        {t('ncr.title')} #{capa.ncrId}
                      </button>
                    ) : (
                      <span style={{ color: '#7f8c8d' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getPriorityBadgeClass(capa.priority)}`}>
                      {t(`capa.priorities.${capa.priority}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(capa.status)}`}>
                      {t(`capa.statuses.${capa.status}`)}
                    </span>
                  </td>
                  <td>{capa.actionOwnerName || `${t('common.user')} ${capa.actionOwner}`}</td>
                  <td>
                    {new Date(capa.targetDate).toLocaleDateString()}
                    {isOverdue(capa.targetDate) && capa.status !== 'closed' && (
                      <span style={{ color: 'red', marginLeft: '5px', fontWeight: 'bold' }}>⚠ {t('capa.overdueItems').toUpperCase()}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-view"
                        onClick={() => handleViewCAPA(capa.id)}
                        title={t('common.view')}
                      >
                        👁️
                      </button>
                      {canEdit && (
                        <button
                          className="btn-edit"
                          onClick={() => navigate(`/capa/${capa.id}/edit`)}
                          title={t('capa.editCAPA')}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
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
