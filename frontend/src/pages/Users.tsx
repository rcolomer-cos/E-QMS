import { useState, useEffect } from 'react';
import { getUsers, deleteUser, updateUserRole } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import { getCurrentUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import '../styles/Users.css';

const Users = () => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [newRole, setNewRole] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const roles = ['admin', 'manager', 'auditor', 'user', 'viewer'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load users';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success('User deactivated successfully');
      await loadUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to deactivate user';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRoleUpdate = async (userId: number) => {
    try {
      await updateUserRole(userId, newRole);
      setEditingRole(null);
      setNewRole('');
      toast.showUpdateSuccess('User role');
      await loadUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update role';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const startEditingRole = (userId: number, currentRole: string) => {
    setEditingRole(userId);
    setNewRole(currentRole);
  };

  const cancelEditingRole = () => {
    setEditingRole(null);
    setNewRole('');
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'role-badge admin';
      case 'manager':
        return 'role-badge manager';
      case 'auditor':
        return 'role-badge auditor';
      case 'user':
        return 'role-badge user';
      case 'viewer':
        return 'role-badge viewer';
      default:
        return 'role-badge';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  const handleUserCreated = () => {
    loadUsers();
    setShowCreateDialog(false);
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="subtitle">Manage system users and their roles</p>
        </div>
        <button className="btn-create-user" onClick={() => navigate('/users/create')}>
          + Create User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Name</th>
              <th>Department</th>
              <th>Role</th>
              <th>Groups</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar user={user} size="small" />
                    <span>
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : 'N/A'}
                    </span>
                  </div>
                </td>
                <td>{user.department || 'N/A'}</td>
                <td>
                  {editingRole === user.id ? (
                    <div className="role-edit">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="role-select"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRoleUpdate(user.id)}
                        className="btn-save"
                      >
                        ✓
                      </button>
                      <button onClick={cancelEditingRole} className="btn-cancel">
                        ✗
                      </button>
                    </div>
                  ) : (
                    <span className={getRoleBadgeClass(user.role || 'user')}>
                      {user.role || 'user'}
                    </span>
                  )}
                </td>
                <td>
                  {user.groups && user.groups.length > 0 ? (
                    <div className="user-groups">
                      {user.groups.map((group, index) => (
                        <span key={group.id} className="group-badge">
                          {group.name}
                          {index < user.groups!.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-groups">None</span>
                  )}
                </td>
                <td>
                  <span className={user.active ? 'status-active' : 'status-inactive'}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td className="actions-cell">
                  {currentUser?.id !== user.id && (
                    <>
                      <button
                        onClick={() => startEditingRole(user.id, user.role || 'user')}
                        className="btn-edit"
                        title="Change Role"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn-delete"
                        title="Deactivate User"
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                  {currentUser?.id === user.id && (
                    <span className="self-indicator">(You)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog removed; creation handled via dedicated route */}
    </div>
  );
};

export default Users;
