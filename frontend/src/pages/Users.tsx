import { useState, useEffect } from 'react';
import {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  User,
  CreateUserData,
  UpdateUserData,
} from '../services/userService';
import { getCurrentUser } from '../services/authService';
import UserForm from '../components/UserForm';
import '../styles/Users.css';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setError('');
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateUserData | UpdateUserData) => {
    if (editingUser) {
      // Update existing user - optimistic update
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...(data as UpdateUserData) } : u
      );
      setUsers(updatedUsers);
      
      try {
        await updateUser(editingUser.id, data as UpdateUserData);
        setShowForm(false);
        setEditingUser(null);
        // Reload to get fresh data from server
        await loadUsers();
      } catch (err: any) {
        // Revert optimistic update on error
        await loadUsers();
        throw err;
      }
    } else {
      // Create new user
      try {
        await createUser(data as CreateUserData);
        setShowForm(false);
        // Reload to get the new user with full details
        await loadUsers();
      } catch (err: any) {
        throw err;
      }
    }
  };

  const handleDeactivateUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own account');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate user "${user.username}"?`)) {
      return;
    }

    // Optimistic update
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, active: false } : u
    );
    setUsers(updatedUsers);

    try {
      await deactivateUser(user.id);
      // Reload to confirm server state
      await loadUsers();
    } catch (err: any) {
      // Revert optimistic update on error
      await loadUsers();
      setError(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={handleCreateUser}>
          Create New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={!user.active ? 'inactive' : ''}>
                  <td>{user.username}</td>
                  <td>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '-'}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.department || '-'}</td>
                  <td>
                    <span className={`status-badge status-${user.active ? 'active' : 'inactive'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.active && (
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-deactivate"
                            onClick={() => handleDeactivateUser(user)}
                            disabled={user.id === currentUser?.id}
                            title={
                              user.id === currentUser?.id
                                ? 'Cannot deactivate own account'
                                : 'Deactivate user'
                            }
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      {!user.active && (
                        <span className="text-muted">No actions available</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}

export default Users;
