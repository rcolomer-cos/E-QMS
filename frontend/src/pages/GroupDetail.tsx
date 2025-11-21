import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { getCurrentUser } from '../services/authService';
import {
  getGroupById,
  getGroupUsers,
  getGroupDocuments,
  addUsersToGroup,
  removeUsersFromGroup,
  Group,
  GroupUser,
  GroupDocument,
} from '../services/groupService';
import { getUsers, User } from '../services/userService';
import Avatar from '../components/Avatar';
import '../styles/GroupDetail.css';

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = getCurrentUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<GroupUser[]>([]);
  const [documents, setDocuments] = useState<GroupDocument[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'documents'>('users');

  // Check user permissions
  const roleNames: string[] = ((currentUser?.roles?.map(r => r.name)) || (currentUser?.role ? [currentUser.role as string] : [])) as string[];
  const normalizeRole = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n === 'administrator' || n.startsWith('admin')) return 'admin';
    if (n === 'super user' || n === 'super-user' || n.startsWith('super')) return 'superuser';
    if (n.startsWith('manager')) return 'manager';
    return n;
  };
  const hasRole = (r: string) => roleNames.map(normalizeRole).includes(r.toLowerCase());
  const canAddUsers = hasRole('admin') || hasRole('manager') || hasRole('superuser');
  const canRemoveUsers = hasRole('superuser');

  useEffect(() => {
    if (id) {
      loadGroupData();
    }
  }, [id]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const groupId = parseInt(id!, 10);
      const [groupData, usersData, docsData] = await Promise.all([
        getGroupById(groupId),
        getGroupUsers(groupId),
        getGroupDocuments(groupId),
      ]);
      setGroup(groupData);
      setUsers(usersData);
      setDocuments(docsData);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load group data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddUsersModal = async () => {
    try {
      const allUsersData = await getUsers();
      // Filter out users already in the group
      const existingUserIds = users.map((u) => u.id);
      const availableUsers = allUsersData.filter((u) => !existingUserIds.includes(u.id) && u.active);
      setAllUsers(availableUsers);
      setShowAddUsersModal(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load users';
      toast.error(errorMsg);
    }
  };

  const handleCloseAddUsersModal = () => {
    setShowAddUsersModal(false);
    setSelectedUserIds([]);
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddUsers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      await addUsersToGroup(parseInt(id!, 10), selectedUserIds);
      toast.showCreateSuccess('Users added to group');
      await loadGroupData();
      handleCloseAddUsersModal();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to add users to group';
      toast.error(errorMsg);
    }
  };

  const handleRemoveUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this group?`)) {
      return;
    }

    try {
      await removeUsersFromGroup(parseInt(id!, 10), [userId]);
      toast.showDeleteSuccess('User removed from group');
      await loadGroupData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove user from group';
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return <div className="loading">Loading group details...</div>;
  }

  if (error || !group) {
    return (
      <div className="error">
        <p>{error || 'Group not found'}</p>
        <button className="btn-primary" onClick={() => navigate('/settings?tab=groups')}>
          ← Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="group-detail">
      <div className="page-header">
        <div>
          <button className="btn-secondary back-button" onClick={() => navigate('/settings?tab=groups')}>
            ← Back to Groups
          </button>
          <h1>{group.name}</h1>
          <p className="group-description">{group.description || 'No description'}</p>
        </div>
        <span className={`status-badge ${group.active ? 'active' : 'inactive'}`}>
          {group.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents ({documents.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Group Members</h2>
            {canAddUsers && (
              <button className="btn-primary" onClick={handleOpenAddUsersModal}>
                Add Users
              </button>
            )}
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <p>No users in this group yet.</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Added On</th>
                    <th>Added By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar user={user} size="small" />
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.department || '-'}</td>
                      <td>{new Date(user.addedAt).toLocaleDateString()}</td>
                      <td>
                        {user.addedByFirstName && user.addedByLastName
                          ? `${user.addedByFirstName} ${user.addedByLastName}`
                          : '-'}
                      </td>
                      <td>
                        {canRemoveUsers ? (
                          <button
                            className="btn-danger btn-small"
                            onClick={() =>
                              handleRemoveUser(user.id, `${user.firstName} ${user.lastName}`)
                            }
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="text-muted">{canAddUsers ? 'Cannot remove' : 'View only'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Assigned Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              <p>No documents assigned to this group yet.</p>
              <p className="hint">Documents can be assigned to groups from the document editor.</p>
            </div>
          ) : (
            <div className="documents-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Assigned On</th>
                    <th>Assigned By</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.title}</td>
                      <td>{doc.documentType}</td>
                      <td>{doc.category}</td>
                      <td>{doc.version}</td>
                      <td>
                        <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
                      </td>
                      <td>{new Date(doc.assignedAt).toLocaleDateString()}</td>
                      <td>
                        {doc.assignedByFirstName && doc.assignedByLastName
                          ? `${doc.assignedByFirstName} ${doc.assignedByLastName}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddUsersModal && (
        <div className="modal-overlay" onClick={handleCloseAddUsersModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Users to Group</h2>
              <button className="modal-close" onClick={handleCloseAddUsersModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {allUsers.length === 0 ? (
                <p>No available users to add.</p>
              ) : (
                <div className="user-selection-list">
                  {allUsers.map((user) => (
                    <div key={user.id} className="user-selection-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleToggleUser(user.id)}
                        />
                        <Avatar user={user} size="small" />
                        <span className="user-info">
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                          <span className="user-email">{user.email}</span>
                          {user.department && <span className="user-dept">({user.department})</span>}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleCloseAddUsersModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddUsers}
                disabled={selectedUserIds.length === 0}
              >
                Add Selected ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
