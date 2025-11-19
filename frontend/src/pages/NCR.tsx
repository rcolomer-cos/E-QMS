import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNCRs, createNCR, CreateNCRData } from '../services/ncrService';
import { getUsers } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { NCR as NCRType, User } from '../types';
import NCRForm from '../components/NCRForm';
import api from '../services/api';
import '../styles/NCR.css';

function NCR() {
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
    return <div className="loading">Loading NCRs...</div>;
  }

  return (
    <div className="ncr-page">
      <div className="page-header">
        <div>
          <h1>Non-Conformance Reports (NCR)</h1>
          <p className="subtitle">Manage and track non-conformances</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="tw-btn tw-btn-secondary" onClick={() => navigate('/ncr/dashboard')}>
            Dashboard
          </button>
          <button className="tw-btn tw-btn-primary" onClick={handleOpenModal}>
            Create NCR
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NCR Number</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Detected Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ncrs.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  No NCRs found
                </td>
              </tr>
            ) : (
              ncrs.map((ncr) => (
                <tr key={ncr.id}>
                  <td>{ncr.ncrNumber}</td>
                  <td>{ncr.title}</td>
                  <td>
                    <span className={`severity-badge severity-${ncr.severity}`}>
                      {ncr.severity}
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
                      className="tw-btn tw-btn-small tw-btn-primary" 
                      onClick={() => navigate(`/ncr/${ncr.id}`)}
                    >
                      View
                    </button>
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
