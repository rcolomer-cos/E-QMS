import { useState, useEffect } from 'react';
import {
  getProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
  getProcessOwners,
  assignProcessOwner,
  removeProcessOwner,
  CreateProcessData,
  UpdateProcessData,
  AssignProcessOwnerData,
} from '../services/processService';
import { getDepartments } from '../services/departmentService';
import { getUsers } from '../services/userService';
import { Process, Department, ProcessOwner, User } from '../types';
import { getCurrentUser } from '../services/authService';
import '../styles/Processes.css';

const Processes = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [processOwners, setProcessOwners] = useState<ProcessOwner[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateProcessData>({
    name: '',
    code: '',
    description: '',
    departmentId: undefined,
    processCategory: '',
    processType: 'main',
    parentProcessId: null,
    objective: '',
    scope: '',
  });
  const [ownerFormData, setOwnerFormData] = useState<AssignProcessOwnerData>({
    ownerId: 0,
    isPrimaryOwner: false,
    notes: '',
  });

  useEffect(() => {
    loadData();
    setCurrentUser(getCurrentUser());
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [processesData, departmentsData, usersData] = await Promise.all([
        getProcesses(),
        getDepartments(),
        getUsers(),
      ]);
      setProcesses(processesData);
      setDepartments(departmentsData);
      setUsers(usersData);
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
        processType: process.processType || 'main',
        parentProcessId: process.parentProcessId ?? null,
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
        processType: 'main',
        parentProcessId: null,
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
      processType: 'main',
      parentProcessId: null,
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
          processType: formData.processType,
          parentProcessId: formData.parentProcessId,
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

  const handleOpenOwnersModal = async (process: Process) => {
    setSelectedProcess(process);
    try {
      const owners = await getProcessOwners(process.id);
      setProcessOwners(owners);
      setShowOwnersModal(true);
      setOwnerFormData({
        ownerId: 0,
        isPrimaryOwner: false,
        notes: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load process owners');
    }
  };

  const handleCloseOwnersModal = () => {
    setShowOwnersModal(false);
    setSelectedProcess(null);
    setProcessOwners([]);
    setOwnerFormData({
      ownerId: 0,
      isPrimaryOwner: false,
      notes: '',
    });
  };

  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcess || !ownerFormData.ownerId) {
      return;
    }

    try {
      await assignProcessOwner(selectedProcess.id, ownerFormData);
      const owners = await getProcessOwners(selectedProcess.id);
      setProcessOwners(owners);
      setOwnerFormData({
        ownerId: 0,
        isPrimaryOwner: false,
        notes: '',
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign process owner');
    }
  };

  const handleRemoveOwner = async (ownerId: number) => {
    if (!selectedProcess) return;
    if (!window.confirm('Are you sure you want to remove this process owner?')) {
      return;
    }

    try {
      await removeProcessOwner(selectedProcess.id, ownerId);
      const owners = await getProcessOwners(selectedProcess.id);
      setProcessOwners(owners);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove process owner');
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
        {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superuser') && (
          <button className="btn-add" onClick={() => handleOpenModal()}>
            Add Process
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Parent</th>
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
                <td>{proc.processType || 'N/A'}</td>
                <td>{proc.parentProcessId ? processes.find(p => p.id === proc.parentProcessId)?.name || proc.parentProcessId : '-'}</td>
                <td>{proc.departmentName || 'N/A'}</td>
                <td>{proc.processCategory || 'N/A'}</td>
                <td>{proc.description || 'N/A'}</td>
                <td>{formatDate(proc.createdAt)}</td>
                <td className="actions-cell">
                  {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superuser') && (
                    <button
                      onClick={() => handleOpenModal(proc)}
                      className="btn-edit"
                      title="Edit Process"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenOwnersModal(proc)}
                    className="btn-secondary"
                    title="Manage Process Owners"
                  >
                    Owners
                  </button>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superuser') && (
                    <button
                      onClick={() => handleDelete(proc.id)}
                      className="btn-delete"
                      title="Delete Process"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={9} className="no-data">
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
                <label htmlFor="processType">Type *</label>
                <select
                  id="processType"
                  value={formData.processType || 'main'}
                  onChange={(e) => setFormData({ ...formData, processType: e.target.value as any })}
                  required
                >
                  <option value="main">Main</option>
                  <option value="sub">Sub</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="parentProcessId">Parent Process</label>
                <select
                  id="parentProcessId"
                  value={formData.parentProcessId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentProcessId: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                >
                  <option value="">No Parent</option>
                  {processes
                    .filter((p) => p.id !== editingProcess?.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                </select>
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

      {showOwnersModal && selectedProcess && (
        <div className="modal-overlay" onClick={handleCloseOwnersModal}>
          <div className="modal-content owners-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Process Owners - {selectedProcess.name}</h2>
            
            <div className="owners-section">
              <h3>Assigned Owners</h3>
              {processOwners.length > 0 ? (
                <table className="owners-table">
                  <thead>
                    <tr>
                      <th>Owner</th>
                      <th>Email</th>
                      <th>Primary</th>
                      <th>Assigned Date</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processOwners.map((owner) => (
                      <tr key={owner.id}>
                        <td>{owner.ownerName || 'N/A'}</td>
                        <td>{owner.ownerEmail || 'N/A'}</td>
                        <td>
                          {owner.isPrimaryOwner ? (
                            <span className="badge-primary">Primary</span>
                          ) : (
                            <span className="badge-secondary">Secondary</span>
                          )}
                        </td>
                        <td>{formatDate(owner.assignedAt)}</td>
                        <td>{owner.notes || '-'}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveOwner(owner.ownerId)}
                            className="btn-delete-small"
                            title="Remove Owner"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No owners assigned to this process</p>
              )}
            </div>

            <div className="assign-owner-section">
              <h3>Assign New Owner</h3>
              <form onSubmit={handleAssignOwner} className="owner-form">
                <div className="form-group">
                  <label htmlFor="ownerId">User *</label>
                  <select
                    id="ownerId"
                    value={ownerFormData.ownerId || ''}
                    onChange={(e) =>
                      setOwnerFormData({
                        ...ownerFormData,
                        ownerId: parseInt(e.target.value, 10),
                      })
                    }
                    required
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName} (${user.email})`
                          : `${user.username} (${user.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={ownerFormData.isPrimaryOwner}
                      onChange={(e) =>
                        setOwnerFormData({
                          ...ownerFormData,
                          isPrimaryOwner: e.target.checked,
                        })
                      }
                    />
                    Primary Owner
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    value={ownerFormData.notes}
                    onChange={(e) =>
                      setOwnerFormData({
                        ...ownerFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Optional notes about this assignment"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    Assign Owner
                  </button>
                  <button type="button" onClick={handleCloseOwnersModal} className="btn-cancel">
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Processes;
