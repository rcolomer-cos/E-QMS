import { useState, useEffect } from 'react';
import {
  getUserDepartments,
  createUserDepartment,
  deleteUserDepartment,
  setPrimaryDepartment,
  CreateUserDepartmentData,
  UserDepartmentAssignment,
} from '../services/userDepartmentService';
import { getUsers } from '../services/userService';
import { getDepartments } from '../services/departmentService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { Department, User } from '../types';
import '../styles/UserDepartments.css';

const UserDepartments = () => {
  const toast = useToast();
  const user = getCurrentUser();
  const [assignments, setAssignments] = useState<UserDepartmentAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateUserDepartmentData>({
    userId: 0,
    departmentId: 0,
    isPrimary: false,
  });

  // Check user permissions
  const roleNames: string[] = ((user?.roles?.map(r => r.name)) || (user?.role ? [user.role as string] : [])) as string[];
  const normalizeRole = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n === 'administrator' || n.startsWith('admin')) return 'admin';
    if (n === 'super user' || n === 'super-user' || n.startsWith('super')) return 'superuser';
    if (n.startsWith('manager')) return 'manager';
    return n;
  };
  const hasRole = (r: string) => roleNames.map(normalizeRole).includes(r.toLowerCase());
  const canManage = hasRole('superuser') || hasRole('admin') || hasRole('manager');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, usersData, departmentsData] = await Promise.all([
        getUserDepartments(),
        getUsers(),
        getDepartments(),
      ]);
      setAssignments(assignmentsData);
      setUsers(usersData);
      setDepartments(departmentsData);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      userId: 0,
      departmentId: 0,
      isPrimary: false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      userId: 0,
      departmentId: 0,
      isPrimary: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.departmentId) {
      toast.error('Please select both user and department');
      return;
    }

    try {
      await createUserDepartment(formData);
      toast.showCreateSuccess('User-Department Assignment');
      handleCloseModal();
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create assignment';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      await deleteUserDepartment(id);
      toast.showDeleteSuccess('User-Department Assignment');
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete assignment';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await setPrimaryDepartment(id);
      toast.success('Primary department set successfully');
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to set primary department';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading user-department assignments...</div>;
  }

  return (
    <div className="user-departments-page">
      <div className="page-header">
        <h1>User-Department Assignments</h1>
        <p className="subtitle">Assign users to departments</p>
        {canManage && (
          <button className="btn-add" onClick={handleOpenModal}>
            Add Assignment
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {!canManage && (
        <div className="info-message" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
          You have view-only access. Manager, Admin, or Superuser role required to make changes.
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Department</th>
              <th>Code</th>
              <th>Primary</th>
              <th>Assigned By</th>
              <th>Assigned Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.userName || 'N/A'}</td>
                <td>{assignment.userEmail || 'N/A'}</td>
                <td>{assignment.departmentName || 'N/A'}</td>
                <td>
                  <span className="code-badge">{assignment.departmentCode || 'N/A'}</span>
                </td>
                <td>
                  {assignment.isPrimary ? (
                    <span className="badge badge-success">Primary</span>
                  ) : (
                    <span className="badge badge-secondary">Secondary</span>
                  )}
                </td>
                <td>{assignment.assignedByName || 'N/A'}</td>
                <td>{formatDate(assignment.assignedAt)}</td>
                <td className="actions-cell">
                  {canManage ? (
                    <>
                      {!assignment.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(assignment.id)}
                          className="btn-primary-action"
                          title="Set as Primary"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="btn-delete"
                        title="Remove Assignment"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#999', fontSize: '0.9rem' }}>View Only</span>
                  )}
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={8} className="no-data">
                  No user-department assignments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add User-Department Assignment</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="userId">User *</label>
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value, 10) })}
                  required
                >
                  <option value={0}>Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName && u.lastName
                        ? `${u.firstName} ${u.lastName} (${u.email})`
                        : u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="departmentId">Department *</label>
                <select
                  id="departmentId"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value, 10) })}
                  required
                >
                  <option value={0}>Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  />
                  <span>Set as Primary Department</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Create Assignment
                </button>
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDepartments;
