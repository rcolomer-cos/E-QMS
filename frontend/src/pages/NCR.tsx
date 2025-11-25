import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNCRs, createNCR, CreateNCRData, deleteNCR } from '../services/ncrService';
import { getUsers } from '../services/userService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { NCR as NCRType, User } from '../types';
import NCRForm from '../components/NCRForm';
import api from '../services/api';
import '../styles/NCR.css';

function NCR() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [ncrs, setNcrs] = useState<NCRType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ncrData, usersData] = await Promise.all([
        getNCRs(),
        getUsers(),
      ]);
      setNcrs(ncrData.data);
      setUsers(usersData);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleDeleteNCR = async (ncrId: number, ncrNumber: string) => {
    if (!window.confirm(`${t('common.confirmDelete')} ${ncrNumber}?`)) {
      return;
    }

    try {
      await deleteNCR(ncrId);
      toast.success(t('messages.deleteSuccess'));
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.deleteError'));
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
  const canDelete = hasRole(['superuser', 'admin', 'manager']);

  const handleCreateNCR = async (data: CreateNCRData, files: File[]) => {
    try {
      // Create the NCR
      const response = await createNCR(data);
      const ncrId = response.id;

      // Upload attachments if any
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('entityType', 'ncr');
          formData.append('entityId', ncrId.toString());
          formData.append('description', `NCR attachment: ${file.name}`);
          
          await api.post('/attachments', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      // Reload data and close modal
      await loadData();
      setShowModal(false);
      toast.showCreateSuccess('NCR');
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create NCR';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="ncr-page">
      <div className="page-header">
        <div>
          <h1>{t('ncr.title')}</h1>
          <p className="subtitle">{t('ncr.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => navigate('/ncr/dashboard')}>
            {t('ncr.dashboard')}
          </button>
          <button className="btn-primary" onClick={() => navigate('/ncr/add')}>
            {t('ncr.createNCR')}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('ncr.ncrNumber')}</th>
              <th>{t('ncr.ncrTitle')}</th>
              <th>{t('ncr.severity')}</th>
              <th>{t('common.status')}</th>
              <th>{t('ncr.detectedDate')}</th>
              <th style={{ width: '200px' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {ncrs.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  {t('ncr.noNCRsFound')}
                </td>
              </tr>
            ) : (
              ncrs.map((ncr) => (
                <tr key={ncr.id}>
                  <td>{ncr.ncrNumber}</td>
                  <td>{ncr.title}</td>
                  <td>
                    <span className={`severity-badge severity-${ncr.severity}`}>
                      {t(`ncr.severities.${ncr.severity}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${ncr.status}`}>
                      {ncr.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(ncr.detectedDate)}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-view" 
                      onClick={() => navigate(`/ncr/${ncr.id}`)}
                      title={t('common.view')}
                    >
                      👁️
                    </button>
                    {canEdit && (
                      <button 
                        className="btn-edit" 
                        onClick={() => navigate(`/ncr/${ncr.id}/edit`)}
                        title={t('common.edit')}
                      >
                        ✏️
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteNCR(ncr.id!, ncr.ncrNumber)}
                        title={t('common.delete')}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for creating NCR */}
      {showModal && currentUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New NCR</h2>
            <NCRForm
              onSubmit={handleCreateNCR}
              onCancel={handleCloseModal}
              users={users}
              currentUserId={currentUser.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default NCR;
