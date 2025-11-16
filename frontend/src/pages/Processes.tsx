import { useState, useEffect } from 'react';
import {
  getProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
  CreateProcessData,
  UpdateProcessData,
} from '../services/processService';
import { getDepartments } from '../services/departmentService';
import { Process, Department } from '../types';
import '../styles/Processes.css';

const Processes = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [formData, setFormData] = useState<CreateProcessData>({
    name: '',
    code: '',
    description: '',
    departmentId: undefined,
    processCategory: '',
    objective: '',
    scope: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [processesData, departmentsData] = await Promise.all([
        getProcesses(),
        getDepartments(),
      ]);
      setProcesses(processesData);
      setDepartments(departmentsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (process?: Process) => {
    if (process) {
      setEditingProcess(process);
      setFormData({
        name: process.name,
        code: process.code,
        description: process.description || '',
        departmentId: process.departmentId,
        processCategory: process.processCategory || '',
        objective: process.objective || '',
        scope: process.scope || '',
      });
    } else {
      setEditingProcess(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        departmentId: undefined,
        processCategory: '',
        objective: '',
        scope: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProcess(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      departmentId: undefined,
      processCategory: '',
      objective: '',
      scope: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProcess) {
        const updateData: UpdateProcessData = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          departmentId: formData.departmentId,
          processCategory: formData.processCategory,
          objective: formData.objective,
          scope: formData.scope,
        };
        await updateProcess(editingProcess.id, updateData);
      } else {
        await createProcess(formData);
      }
      handleCloseModal();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save process');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this process?')) {
      return;
    }

    try {
      await deleteProcess(id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete process');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading processes...</div>;
  }

  return (
    <div className="processes-page">
      <div className="page-header">
        <h1>Process Management</h1>
        <p className="subtitle">Manage organizational processes</p>
        <button className="btn-add" onClick={() => handleOpenModal()}>
          Add Process
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Category</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => (
              <tr key={proc.id}>
                <td>
                  <span className="code-badge">{proc.code}</span>
                </td>
                <td>{proc.name}</td>
                <td>{proc.departmentName || 'N/A'}</td>
                <td>{proc.processCategory || 'N/A'}</td>
                <td>{proc.description || 'N/A'}</td>
                <td>{formatDate(proc.createdAt)}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleOpenModal(proc)}
                    className="btn-edit"
                    title="Edit Process"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(proc.id)}
                    className="btn-delete"
                    title="Delete Process"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={7} className="no-data">
                  No processes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProcess ? 'Edit Process' : 'Add Process'}</h2>
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
                  placeholder="e.g., PROC001"
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
                  placeholder="Process name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="departmentId">Department</label>
                <select
                  id="departmentId"
                  value={formData.departmentId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="processCategory">Category</label>
                <input
                  type="text"
                  id="processCategory"
                  value={formData.processCategory}
                  onChange={(e) => setFormData({ ...formData, processCategory: e.target.value })}
                  maxLength={50}
                  placeholder="Process category"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Process description"
                />
              </div>

              <div className="form-group">
                <label htmlFor="objective">Objective</label>
                <textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  rows={2}
                  placeholder="Process objective"
                />
              </div>

              <div className="form-group">
                <label htmlFor="scope">Scope</label>
                <textarea
                  id="scope"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  rows={2}
                  placeholder="Process scope"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingProcess ? 'Update' : 'Create'}
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

export default Processes;
