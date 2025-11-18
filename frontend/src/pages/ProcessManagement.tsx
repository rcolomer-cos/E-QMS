import { useState, useEffect } from 'react';
import {
  getProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
  CreateProcessData,
} from '../services/processService';
import { Process } from '../types';
import { useToast } from '../contexts/ToastContext';
import '../styles/ProcessManagement.css';

const ProcessManagement = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const toast = useToast();

  const [formData, setFormData] = useState<CreateProcessData>({
    name: '',
    description: '',
    processType: 'main',
    parentProcessId: null,
    displayOrder: undefined,
  });

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const data = await getProcesses();
      setProcesses(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load processes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (process?: Process) => {
    if (process) {
      setEditingProcess(process);
      setFormData({
        name: process.name,
        description: process.description || '',
        processType: process.processType || 'main',
        parentProcessId: process.parentProcessId ?? null,
        displayOrder: process.displayOrder,
      });
    } else {
      setEditingProcess(null);
      // Calculate next displayOrder
      const orders = processes.map(p => p.displayOrder || 0).filter(o => o > 0);
      const maxOrder = orders.length > 0 ? Math.max(...orders) : 0;
      setFormData({
        name: '',
        description: '',
        processType: 'main',
        parentProcessId: null,
        displayOrder: maxOrder + 10,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProcess(null);
    setFormData({
      name: '',
      description: '',
      processType: 'main',
      parentProcessId: null,
      displayOrder: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProcess) {
        await updateProcess(editingProcess.id, formData);
        toast.success('Process updated successfully');
      } else {
        await createProcess(formData);
        toast.success('Process created successfully');
      }
      await loadProcesses();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save process');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete process "${name}"?`)) {
      return;
    }
    try {
      await deleteProcess(id);
      toast.success('Process deleted successfully');
      await loadProcesses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete process');
    }
  };

  const handleMoveUp = async (process: Process, index: number) => {
    if (index === 0) return;
    const prev = groupedProcesses.flatMap(g => g.items)[index - 1];
    if (!prev) return;

    try {
      const currOrder = process.displayOrder ?? index * 10;
      const prevOrder = prev.displayOrder ?? (index - 1) * 10;
      
      await updateProcess(process.id, { displayOrder: prevOrder });
      await updateProcess(prev.id, { displayOrder: currOrder });
      toast.success('Process order updated');
      await loadProcesses();
    } catch (err: any) {
      toast.error('Failed to update order');
    }
  };

  const handleMoveDown = async (process: Process, index: number) => {
    const allItems = groupedProcesses.flatMap(g => g.items);
    if (index >= allItems.length - 1) return;
    const next = allItems[index + 1];
    if (!next) return;

    try {
      const currOrder = process.displayOrder ?? index * 10;
      const nextOrder = next.displayOrder ?? (index + 1) * 10;
      
      await updateProcess(process.id, { displayOrder: nextOrder });
      await updateProcess(next.id, { displayOrder: currOrder });
      toast.success('Process order updated');
      await loadProcesses();
    } catch (err: any) {
      toast.error('Failed to update order');
    }
  };

  // Group by type and parent
  const mainProcesses = processes.filter(p => p.processType === 'main');
  const supportProcesses = processes.filter(p => p.processType === 'support');
  const subProcesses = processes.filter(p => p.processType === 'sub');

  const groupedProcesses = [
    { type: 'main' as const, label: 'Main Processes', items: mainProcesses },
    { type: 'support' as const, label: 'Support Processes', items: supportProcesses },
    { type: 'sub' as const, label: 'Sub Processes', items: subProcesses },
  ].filter(g => g.items.length > 0);

  const allFlat = groupedProcesses.flatMap(g => g.items);

  if (loading) {
    return <div className="loading">Loading processes...</div>;
  }

  return (
    <div className="process-management">
      <div className="process-management-header">
        <div>
          <h2>Process Management</h2>
          <p className="subtitle">Manage main, support, and sub processes</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Process
        </button>
      </div>

      <div className="process-groups">
        {groupedProcesses.map((group) => (
          <div key={group.type} className="process-group">
            <h3 className="group-heading">{group.label}</h3>
            <div className="process-list">
              {group.items.map((process) => {
                const globalIndex = allFlat.findIndex(p => p.id === process.id);
                return (
                  <div key={process.id} className="process-item">
                    <div className="process-info">
                      <div className="process-name">{process.name}</div>
                      {process.description && (
                        <div className="process-description">{process.description}</div>
                      )}
                    </div>
                    <div className="process-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleMoveUp(process, globalIndex)}
                        disabled={globalIndex === 0}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleMoveDown(process, globalIndex)}
                        disabled={globalIndex === allFlat.length - 1}
                        title="Move down"
                      >
                        ▼
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenModal(process)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(process.id, process.name)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {processes.length === 0 && (
          <div className="no-results">No processes defined. Click "Add Process" to create one.</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProcess ? 'Edit Process' : 'Add Process'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Process Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              {/* Code is auto-generated by backend; field hidden from UI */}
              <div className="form-group">
                <label htmlFor="processType">Process Type *</label>
                <select
                  id="processType"
                  value={formData.processType || 'main'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      processType: e.target.value as 'main' | 'sub' | 'support',
                    })
                  }
                  required
                >
                  <option value="main">Main Process</option>
                  <option value="support">Support Process</option>
                  <option value="sub">Sub Process</option>
                </select>
              </div>
              {formData.processType === 'sub' && (
                <div className="form-group">
                  <label htmlFor="parentProcessId">Parent Process (Main only)</label>
                  <select
                    id="parentProcessId"
                    value={formData.parentProcessId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parentProcessId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">None</option>
                    {mainProcesses.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="displayOrder">Display Order</label>
                <input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Auto-assigned if left blank"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProcess ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessManagement;
