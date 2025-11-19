import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
// Process tree removed per requirement; keep only manual flowchart view
import { getOrganizationalHierarchy } from '../services/organizationalChartService';
import { getOrgChartData, updateOrgChartData } from '../services/departmentService';
import OrgChartEditor from '../components/OrgChartEditor';
import OrgChartViewer from '../components/OrgChartViewer';
import { useAuth } from '../services/authService';
import { 
  getDepartments, 
  updateDepartment, 
  createDepartment,
  CreateDepartmentData 
} from '../services/departmentService';
import { 
  updateProcess, 
  createProcess, 
  assignProcessOwner, 
  removeProcessOwner,
  CreateProcessData
} from '../services/processService';
import { getUsers } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { Department, Process, ProcessOwner, User } from '../types';
import '../styles/OrganizationalChart.css';

interface HierarchyData {
  departments: Array<Department & { processes: Array<Process & { owners: ProcessOwner[] }> }>;
  orphanProcesses: Array<Process & { owners: ProcessOwner[] }>;
}

// StyledNode removed with process tree

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75em;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7em;
  margin-left: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
`;

const OrganizationalChart = () => {
  const toast = useToast();
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  // Org chart flow data state
  const [orgChartData, setOrgChartData] = useState<string | null>(null);
  const [orgLoading, setOrgLoading] = useState<boolean>(false);
  const [orgSaving, setOrgSaving] = useState<boolean>(false);
  // Flow mode always on now
  const showFlowMode = true;
  const { user } = useAuth();
  const canEditOrgChart = useMemo(() => {
    const names = user?.roleNames?.map(r => r.toLowerCase()) || [];
    return names.includes('superuser') || names.includes('manager') || names.includes('admin');
  }, [user]);

  // Parse org chart data for editor
  const parsedOrgChart = useMemo(() => {
    if (!orgChartData) return { nodes: [], edges: [] };
    try {
      const parsed = JSON.parse(orgChartData);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return parsed;
      }
      return { nodes: [], edges: [] };
    } catch {
      return { nodes: [], edges: [] };
    }
  }, [orgChartData]);

  // Fetch org chart flow data
  useEffect(() => {
    const fetchOrgChart = async () => {
      setOrgLoading(true);
      try {
        const data = await getOrgChartData();
        setOrgChartData(data.orgChartData || null);
      } catch (error: any) {
        console.error('Failed to load org chart data', error);
        toast.showError('Failed to load organizational chart');
      } finally {
        setOrgLoading(false);
      }
    };
    fetchOrgChart();
  }, [toast]);

  const handleSaveOrgChart = async (flowData: { nodes: any[]; edges: any[] }) => {
    setOrgSaving(true);
    try {
      const json = JSON.stringify(flowData);
      await updateOrgChartData(json);
      setOrgChartData(json);
      toast.showSuccess('Organizational chart saved');
    } catch (error: any) {
      console.error('Save org chart error', error);
      toast.showError(error?.response?.data?.error || 'Failed to save organizational chart');
    } finally {
      setOrgSaving(false);
    }
  };

  // Existing hierarchy fetch (keep original behavior)
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const data = await getOrganizationalHierarchy();
        setHierarchyData(data);
      } catch (error: any) {
        console.error('Failed to load hierarchy', error);
        toast.showError('Failed to load hierarchy');
      }
    };
    fetchHierarchy();
  }, [toast]);

  // Toggle UI & rendering logic injected before original return (search for return statement below)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<{ type: 'department' | 'process'; data: any } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // New modals
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showAddProcessModal, setShowAddProcessModal] = useState(false);
  const [showManageOwnersModal, setShowManageOwnersModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process & { owners: ProcessOwner[] } | null>(null);
  const [newDepartmentData, setNewDepartmentData] = useState<CreateDepartmentData>({
    name: '',
    code: '',
    description: '',
  });
  const [newProcessData, setNewProcessData] = useState<CreateProcessData>({
    name: '',
    code: '',
    description: '',
    processCategory: 'Core',
  });

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [hierarchy, allUsers, allDepartments] = await Promise.all([
        getOrganizationalHierarchy(),
        getUsers(),
        getDepartments(),
      ]);
      setHierarchyData(hierarchy);
      setUsers(allUsers);
      setDepartments(allDepartments);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load organizational chart';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    if (!currentUser) return false;
    const roles = currentUser.roleNames || [currentUser.role];
    return roles.some(role => role === 'admin' || role === 'superuser' || role === 'manager');
  };

  const handleNodeClick = (type: 'department' | 'process', data: any) => {
    if (!editMode || !isAdmin()) return;
    setEditingEntity({ type, data });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntity) return;

    try {
      if (editingEntity.type === 'department') {
        await updateDepartment(editingEntity.data.id, {
          name: editingEntity.data.name,
          code: editingEntity.data.code,
          description: editingEntity.data.description,
          managerId: editingEntity.data.managerId,
        });
        toast.showUpdateSuccess('Department');
      } else if (editingEntity.type === 'process') {
        await updateProcess(editingEntity.data.id, {
          name: editingEntity.data.name,
          code: editingEntity.data.code,
          description: editingEntity.data.description,
          departmentId: editingEntity.data.departmentId,
          processCategory: editingEntity.data.processCategory,
          objective: editingEntity.data.objective,
          scope: editingEntity.data.scope,
        });
        toast.showUpdateSuccess('Process');
      }
      setShowEditModal(false);
      setEditingEntity(null);
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to save changes';
      toast.error(errorMsg);
    }
  };

  const handleProcessDrop = async (processId: number, targetDepartmentId: number | null) => {
    try {
      await updateProcess(processId, {
        departmentId: targetDepartmentId || undefined,
      });
      toast.showUpdateSuccess('Process moved');
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to move process';
      toast.error(errorMsg);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentData.name || !newDepartmentData.code) {
      toast.error('Name and Code are required');
      return;
    }

    try {
      await createDepartment(newDepartmentData);
      toast.success('Department created successfully');
      setShowAddDepartmentModal(false);
      setNewDepartmentData({ name: '', code: '', description: '' });
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create department';
      toast.error(errorMsg);
    }
  };

  const handleAddProcess = async () => {
    if (!newProcessData.name || !newProcessData.code) {
      toast.error('Name and Code are required');
      return;
    }

    try {
      await createProcess(newProcessData);
      toast.success('Process created successfully');
      setShowAddProcessModal(false);
      setNewProcessData({ name: '', code: '', description: '', processCategory: 'Core' });
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create process';
      toast.error(errorMsg);
    }
  };

  const handleManageOwners = (process: Process & { owners: ProcessOwner[] }) => {
    setSelectedProcess(process);
    setShowManageOwnersModal(true);
  };

  const handleAssignOwner = async (ownerId: number, isPrimaryOwner: boolean) => {
    if (!selectedProcess) return;

    try {
      await assignProcessOwner(selectedProcess.id, { ownerId, isPrimaryOwner });
      toast.success('Process owner assigned successfully');
      loadData();
      // Refresh selected process
      const updatedHierarchy = await getOrganizationalHierarchy();
      const allProcesses = [
        ...updatedHierarchy.departments.flatMap((d: any) => d.processes),
        ...updatedHierarchy.orphanProcesses,
      ];
      const updated = allProcesses.find((p: any) => p.id === selectedProcess.id);
      if (updated) setSelectedProcess(updated);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to assign owner';
      toast.error(errorMsg);
    }
  };

  const handleRemoveOwner = async (ownerId: number) => {
    if (!selectedProcess) return;

    try {
      await removeProcessOwner(selectedProcess.id, ownerId);
      toast.success('Process owner removed successfully');
      loadData();
      // Refresh selected process
      const updatedHierarchy = await getOrganizationalHierarchy();
      const allProcesses = [
        ...updatedHierarchy.departments.flatMap((d: any) => d.processes),
        ...updatedHierarchy.orphanProcesses,
      ];
      const updated = allProcesses.find((p: any) => p.id === selectedProcess.id);
      if (updated) setSelectedProcess(updated);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove owner';
      toast.error(errorMsg);
    }
  };

  const renderUserNode = (owner: ProcessOwner) => (
    <TreeNode
      key={`owner-${owner.id}`}
      label={
        <StyledNode className={owner.isPrimaryOwner ? "user primary-owner" : "user"}>
          <div>
            {owner.ownerName}
            {owner.isPrimaryOwner && <RoleBadge>⭐ Primary</RoleBadge>}
          </div>
          {editMode && isAdmin() && (
            <ActionButtons>
              <ActionButton onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Remove ${owner.ownerName} from this process?`)) {
                  handleRemoveOwner(owner.ownerId);
                }
              }}>
                Remove
              </ActionButton>
            </ActionButtons>
          )}
        </StyledNode>
      }
    />
  );

  const DraggableProcessNode = ({ 
    process, 
    sourceDepartmentId 
  }: { 
    process: Process & { owners: ProcessOwner[] }; 
    sourceDepartmentId?: number;
  }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent) => {
      if (!editMode || !isAdmin()) {
        e.preventDefault();
        return;
      }
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify({
        processId: process.id,
        sourceDepartmentId
      }));
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    return (
      <div
        draggable={editMode && isAdmin()}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <StyledNode
          className="process"
          isDragging={isDragging}
          onClick={() => !isDragging && handleNodeClick('process', process)}
          style={{ cursor: editMode && isAdmin() ? 'move' : 'pointer' }}
        >
          <div style={{ fontWeight: 'bold' }}>{process.name}</div>
          <div style={{ fontSize: '0.85em', marginTop: '4px', opacity: 0.9 }}>
            {process.code}
          </div>
          {process.processCategory && (
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              {process.processCategory}
            </div>
          )}
          {editMode && isAdmin() && (
            <ActionButtons>
              <ActionButton onClick={(e) => {
                e.stopPropagation();
                handleManageOwners(process);
              }}>
                👥 Owners
              </ActionButton>
              <ActionButton onClick={(e) => {
                e.stopPropagation();
                handleNodeClick('process', process);
              }}>
                ✏️ Edit
              </ActionButton>
            </ActionButtons>
          )}
        </StyledNode>
      </div>
    );
  };

  const renderProcessNode = (process: Process & { owners: ProcessOwner[] }, departmentId?: number) => (
    <TreeNode
      key={`process-${process.id}`}
      label={<DraggableProcessNode process={process} sourceDepartmentId={departmentId} />}
    >
      {process.owners && process.owners.length > 0 ? (
        process.owners.map(owner => renderUserNode(owner))
      ) : (
        <TreeNode
          label={
            <StyledNode className="user" style={{ opacity: 0.5 }}>
              {editMode && isAdmin() ? (
                <>
                  <div>No assigned owners</div>
                  <ActionButtons>
                    <ActionButton onClick={(e) => {
                      e.stopPropagation();
                      handleManageOwners(process);
                    }}>
                      Assign Owner
                    </ActionButton>
                  </ActionButtons>
                </>
              ) : (
                'No assigned owners'
              )}
            </StyledNode>
          }
        />
      )}
    </TreeNode>
  );

  const DroppableDepartmentNode = ({ 
    department 
  }: { 
    department: Department & { processes: Array<Process & { owners: ProcessOwner[] }> };
  }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      if (!editMode || !isAdmin()) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsOver(true);
    };

    const handleDragLeave = () => {
      setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.processId && data.sourceDepartmentId !== department.id) {
          handleProcessDrop(data.processId, department.id);
        }
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    };

    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <StyledNode
          className={department.managerName ? "department manager" : "department"}
          isOver={isOver}
          onClick={() => handleNodeClick('department', department)}
        >
          <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{department.name}</div>
          <div style={{ fontSize: '0.85em', marginTop: '4px', opacity: 0.9 }}>
            {department.code}
          </div>
          {department.managerName && (
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              👔 Manager: {department.managerName}
            </div>
          )}
          {editMode && isAdmin() && isOver && (
            <div style={{ fontSize: '0.75em', marginTop: '4px', fontStyle: 'italic' }}>
              Drop to move process here
            </div>
          )}
          {editMode && isAdmin() && (
            <ActionButtons>
              <ActionButton onClick={(e) => {
                e.stopPropagation();
                handleNodeClick('department', department);
              }}>
                ✏️ Edit
              </ActionButton>
            </ActionButtons>
          )}
        </StyledNode>
      </div>
    );
  };

  const renderDepartmentNode = (department: Department & { processes: Array<Process & { owners: ProcessOwner[] }> }) => (
    <TreeNode
      key={`dept-${department.id}`}
      label={<DroppableDepartmentNode department={department} />}
    >
      {department.processes && department.processes.length > 0 ? (
        department.processes.map(process => renderProcessNode(process, department.id))
      ) : (
        <TreeNode
          label={
            <StyledNode className="process" style={{ opacity: 0.5 }}>
              {editMode && isAdmin() ? 'Drop a process here or add new' : 'No processes assigned'}
            </StyledNode>
          }
        />
      )}
    </TreeNode>
  );

  if (loading) {
    return (
      <div className="org-chart-page">
        <div className="loading">Loading organizational chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="org-chart-page">
        <div className="error-message">{error}</div>
        <button className="btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  if (!hierarchyData) {
    return (
      <div className="org-chart-page">
        <div className="error-message">No organizational data available</div>
      </div>
    );
  }

  return (
    <div className="org-chart-page">
      <div className="page-header">
        <div>
          <h1>Organizational Chart</h1>
          <p className="subtitle">Manual people-centric flowchart (process tree removed)</p>
        </div>
        <div className="header-actions">
          {/* Removed tree/department/process management buttons */}
        </div>
      </div>

      {editMode && isAdmin() && (
        <div className="edit-info">
          <strong>Edit Mode Active:</strong> 
          <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
            <li>Drag processes to move them between departments</li>
            <li>Click "👥 Owners" to assign/unassign process owners</li>
            <li>Click "✏️ Edit" on departments or processes to edit details</li>
            <li>Use "+ Add Department" and "+ Add Process" buttons to create new items</li>
          </ul>
        </div>
      )}

      <div className="org-chart-full-wrapper">
        <div className="org-chart-surface">
          {orgLoading ? (
            <div className="org-chart-loading">Loading organizational chart...</div>
          ) : canEditOrgChart ? (
            <OrgChartEditor
              initialData={parsedOrgChart}
              onSave={handleSaveOrgChart}
              readOnly={false}
            />
          ) : (
            <OrgChartViewer data={orgChartData || ''} />
          )}
          {orgSaving && <div className="org-chart-saving-indicator">Saving...</div>}
        </div>
      </div>

      {canEditOrgChart && (
        <div className="org-chart-footer-bar">
          <strong>Instructions:</strong>
          <span>Click "Add Person" then enter name & department</span>
          <span>•</span>
          <span>Drag nodes to reposition; connect if desired</span>
          <span>•</span>
          <span>Double-click a node to edit name & department</span>
          <span>•</span>
          <span>Scroll to zoom; drag background to pan</span>
        </div>
      )}

      {showEditModal && editingEntity && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {editingEntity.type === 'department' ? 'Department' : 'Process'}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingEntity.data.name}
                  onChange={e => setEditingEntity({
                    ...editingEntity,
                    data: { ...editingEntity.data, name: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  type="text"
                  value={editingEntity.data.code}
                  onChange={e => setEditingEntity({
                    ...editingEntity,
                    data: { ...editingEntity.data, code: e.target.value }
                  })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingEntity.data.description || ''}
                  onChange={e => setEditingEntity({
                    ...editingEntity,
                    data: { ...editingEntity.data, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>
              {editingEntity.type === 'department' && (
                <div className="form-group">
                  <label>Manager</label>
                  <select
                    value={editingEntity.data.managerId || ''}
                    onChange={e => setEditingEntity({
                      ...editingEntity,
                      data: { ...editingEntity.data, managerId: e.target.value ? parseInt(e.target.value) : undefined }
                    })}
                  >
                    <option value="">No Manager</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {editingEntity.type === 'process' && (
                <>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={editingEntity.data.departmentId || ''}
                      onChange={e => setEditingEntity({
                        ...editingEntity,
                        data: { ...editingEntity.data, departmentId: e.target.value ? parseInt(e.target.value) : undefined }
                      })}
                    >
                      <option value="">No Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={editingEntity.data.processCategory || ''}
                      onChange={e => setEditingEntity({
                        ...editingEntity,
                        data: { ...editingEntity.data, processCategory: e.target.value }
                      })}
                      placeholder="e.g., Core, Management, Support"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="modal-overlay" onClick={() => setShowAddDepartmentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Department</h2>
              <button className="close-btn" onClick={() => setShowAddDepartmentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newDepartmentData.name}
                  onChange={e => setNewDepartmentData({ ...newDepartmentData, name: e.target.value })}
                  placeholder="e.g., Quality Assurance"
                />
              </div>
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  value={newDepartmentData.code}
                  onChange={e => setNewDepartmentData({ ...newDepartmentData, code: e.target.value })}
                  placeholder="e.g., QA"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newDepartmentData.description || ''}
                  onChange={e => setNewDepartmentData({ ...newDepartmentData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the department"
                />
              </div>
              <div className="form-group">
                <label>Manager</label>
                <select
                  value={newDepartmentData.managerId || ''}
                  onChange={e => setNewDepartmentData({ 
                    ...newDepartmentData, 
                    managerId: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                >
                  <option value="">No Manager</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddDepartmentModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddDepartment}>
                Add Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Process Modal */}
      {showAddProcessModal && (
        <div className="modal-overlay" onClick={() => setShowAddProcessModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Process</h2>
              <button className="close-btn" onClick={() => setShowAddProcessModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newProcessData.name}
                  onChange={e => setNewProcessData({ ...newProcessData, name: e.target.value })}
                  placeholder="e.g., Document Control"
                />
              </div>
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  value={newProcessData.code || ''}
                  onChange={e => setNewProcessData({ ...newProcessData, code: e.target.value })}
                  placeholder="e.g., DC-001"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProcessData.description || ''}
                  onChange={e => setNewProcessData({ ...newProcessData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the process"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={newProcessData.departmentId || ''}
                  onChange={e => setNewProcessData({ 
                    ...newProcessData, 
                    departmentId: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                >
                  <option value="">No Department (Unassigned)</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newProcessData.processCategory || 'Core'}
                  onChange={e => setNewProcessData({ ...newProcessData, processCategory: e.target.value })}
                >
                  <option value="Core">Core</option>
                  <option value="Management">Management</option>
                  <option value="Support">Support</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddProcessModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddProcess}>
                Add Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Process Owners Modal */}
      {showManageOwnersModal && selectedProcess && (
        <div className="modal-overlay" onClick={() => setShowManageOwnersModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Process Owners</h2>
              <button className="close-btn" onClick={() => setShowManageOwnersModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
                {selectedProcess.name} ({selectedProcess.code})
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#34495e' }}>Current Owners</h4>
                {selectedProcess.owners && selectedProcess.owners.length > 0 ? (
                  <div className="owners-list">
                    {selectedProcess.owners.map(owner => (
                      <div key={owner.id} className="owner-item">
                        <div>
                          <strong>{owner.ownerName}</strong>
                          {owner.isPrimaryOwner && <RoleBadge style={{ marginLeft: '8px', color: '#2c3e50' }}>⭐ Primary</RoleBadge>}
                          <div style={{ fontSize: '0.85em', color: '#7f8c8d' }}>{owner.ownerEmail}</div>
                        </div>
                        <button 
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem' }}
                          onClick={() => {
                            if (window.confirm(`Remove ${owner.ownerName} from this process?`)) {
                              handleRemoveOwner(owner.ownerId);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No owners assigned yet</p>
                )}
              </div>

              <div>
                <h4 style={{ marginBottom: '0.5rem', color: '#34495e' }}>Assign New Owner</h4>
                <div className="form-group">
                  <label>Select User</label>
                  <select id="new-owner-select">
                    <option value="">Choose a user...</option>
                    {users
                      .filter(user => !selectedProcess.owners?.some(o => o.ownerId === user.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="is-primary-owner" />
                    <span>Set as Primary Owner</span>
                  </label>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    const select = document.getElementById('new-owner-select') as HTMLSelectElement;
                    const checkbox = document.getElementById('is-primary-owner') as HTMLInputElement;
                    const ownerId = parseInt(select.value);
                    if (ownerId) {
                      handleAssignOwner(ownerId, checkbox.checked);
                      select.value = '';
                      checkbox.checked = false;
                    } else {
                      toast.error('Please select a user');
                    }
                  }}
                >
                  Assign Owner
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowManageOwnersModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalChart;
