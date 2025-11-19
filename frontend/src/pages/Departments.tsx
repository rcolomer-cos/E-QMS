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
import { useToast } from '../contexts/ToastContext';
import { Department, User } from '../types';
import '../styles/Departments.css';

const Departments = () => {
  const toast = useToast();
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
        <h1>Department Management</h1>
        <p className="subtitle">Manage organizational departments</p>
        <button className="btn-add" onClick={() => handleOpenModal()}>
          Add Department
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

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
