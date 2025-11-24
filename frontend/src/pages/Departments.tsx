import { useState, useEffect } from 'react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  CreateDepartmentData,
  UpdateDepartmentData,
} from '../services/departmentService';
import { getUsers } from '../services/userService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { Department, User } from '../types';
import '../styles/Departments.css';

const Departments = () => {
  const toast = useToast();
  const user = getCurrentUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: '',
    code: '',
    description: '',
    managerId: undefined,
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
      const [departmentsData, usersData] = await Promise.all([
        getDepartments(),
        getUsers(),
      ]);
      setDepartments(departmentsData);
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

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
        managerId: department.managerId,
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        managerId: undefined,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      managerId: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        const updateData: UpdateDepartmentData = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          managerId: formData.managerId,
        };
        await updateDepartment(editingDepartment.id, updateData);
        toast.showUpdateSuccess('Department');
      } else {
        await createDepartment(formData);
        toast.showCreateSuccess('Department');
      }
      handleCloseModal();
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to save department';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this department?')) {
      return;
    }

    try {
      await deleteDepartment(id);
      toast.showDeleteSuccess('Department');
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete department';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading departments...</div>;
  }

  return (
    <div className="departments-page">
      <div className="page-header">
        <div>
          <h1>Department Management</h1>
          <p className="subtitle">Manage organizational departments</p>
        </div>
        {canManage && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn-add"
          >
            Add Department
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {!canManage && (
        <div className="info-message" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
          You have view-only access to departments. Manager, Admin, or Superuser role required to make changes.
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              <th>Manager</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td>
                  <span className="code-badge">{dept.code}</span>
                </td>
                <td>{dept.name}</td>
                <td>{dept.description || 'N/A'}</td>
                <td>{dept.managerName || 'N/A'}</td>
                <td>{formatDate(dept.createdAt)}</td>
                <td className="actions-cell">
                  {canManage ? (
                    <>
                      <button
                        onClick={() => handleOpenModal(dept)}
                        className="btn-edit"
                        title="Edit Department"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="btn-delete"
                        title="Delete Department"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#999', fontSize: '0.9rem' }}>View Only</span>
                  )}
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={6} className="no-data">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingDepartment ? 'Edit Department' : 'Add Department'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="code">Code *</label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  maxLength={20}
                  placeholder="e.g., DEPT001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="Department name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Department description"
                />
              </div>

              <div className="form-group">
                <label htmlFor="managerId">Manager</label>
                <select
                  id="managerId"
                  value={formData.managerId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      managerId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                >
                  <option value="">No Manager</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName} (${user.username})`
                        : user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingDepartment ? 'Update' : 'Create'}
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

export default Departments;
