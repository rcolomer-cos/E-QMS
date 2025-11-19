import { useState, useEffect } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import styled from 'styled-components';
import { getOrganizationalHierarchy } from '../services/organizationalChartService';
import { getDepartments, updateDepartment } from '../services/departmentService';
import { updateProcess } from '../services/processService';
import { getUsers } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { Department, Process, ProcessOwner, User } from '../types';
import '../styles/OrganizationalChart.css';

interface HierarchyData {
  departments: Array<Department & { processes: Array<Process & { owners: ProcessOwner[] }> }>;
  orphanProcesses: Array<Process & { owners: ProcessOwner[] }>;
}

const StyledNode = styled.div`
  padding: 12px 20px;
  border-radius: 8px;
  display: inline-block;
  border: 2px solid #3498db;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.department {
    background-color: #3498db;
    color: white;
    border-color: #2980b9;
    font-weight: 600;
  }

  &.process {
    background-color: #2ecc71;
    color: white;
    border-color: #27ae60;
  }

  &.user {
    background-color: #e74c3c;
    color: white;
    border-color: #c0392b;
    font-size: 0.9em;
    padding: 8px 16px;
  }
`;

const OrganizationalChart = () => {
  const toast = useToast();
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<{ type: 'department' | 'process'; data: any } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

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
    return roles.some(role => role === 'admin' || role === 'superuser');
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

  const renderUserNode = (owner: ProcessOwner) => (
    <TreeNode
      key={`owner-${owner.id}`}
      label={
        <StyledNode className="user">
          <div>{owner.ownerName}</div>
          {owner.isPrimaryOwner && <div style={{ fontSize: '0.8em', marginTop: '4px' }}>⭐ Primary</div>}
        </StyledNode>
      }
    />
  );

  const renderProcessNode = (process: Process & { owners: ProcessOwner[] }) => (
    <TreeNode
      key={`process-${process.id}`}
      label={
        <StyledNode
          className="process"
          onClick={() => handleNodeClick('process', process)}
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
        </StyledNode>
      }
    >
      {process.owners && process.owners.length > 0 ? (
        process.owners.map(owner => renderUserNode(owner))
      ) : (
        <TreeNode
          label={
            <StyledNode className="user" style={{ opacity: 0.5 }}>
              No assigned owners
            </StyledNode>
          }
        />
      )}
    </TreeNode>
  );

  const renderDepartmentNode = (department: Department & { processes: Array<Process & { owners: ProcessOwner[] }> }) => (
    <TreeNode
      key={`dept-${department.id}`}
      label={
        <StyledNode
          className="department"
          onClick={() => handleNodeClick('department', department)}
        >
          <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{department.name}</div>
          <div style={{ fontSize: '0.85em', marginTop: '4px', opacity: 0.9 }}>
            {department.code}
          </div>
          {department.managerName && (
            <div style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
              Manager: {department.managerName}
            </div>
          )}
        </StyledNode>
      }
    >
      {department.processes && department.processes.length > 0 ? (
        department.processes.map(process => renderProcessNode(process))
      ) : (
        <TreeNode
          label={
            <StyledNode className="process" style={{ opacity: 0.5 }}>
              No processes assigned
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
          <p className="subtitle">View and manage your organizational structure</p>
        </div>
        <div className="header-actions">
          {isAdmin() && (
            <button
              className={editMode ? 'btn-secondary' : 'btn-primary'}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
            </button>
          )}
          <button className="btn-primary" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {editMode && isAdmin() && (
        <div className="edit-info">
          <strong>Edit Mode Active:</strong> Click on any department or process to edit its details.
          Use the Departments and Processes pages for more advanced editing options.
        </div>
      )}

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-box department"></span>
          <span>Department</span>
        </div>
        <div className="legend-item">
          <span className="legend-box process"></span>
          <span>Process</span>
        </div>
        <div className="legend-item">
          <span className="legend-box user"></span>
          <span>User/Owner</span>
        </div>
      </div>

      <div className="chart-container">
        <Tree
          lineWidth="2px"
          lineColor="#bdc3c7"
          lineBorderRadius="10px"
          label={
            <StyledNode style={{ 
              backgroundColor: '#34495e', 
              color: 'white',
              borderColor: '#2c3e50',
              fontSize: '1.2em',
              fontWeight: 'bold'
            }}>
              Organization
            </StyledNode>
          }
        >
          {hierarchyData.departments.map(dept => renderDepartmentNode(dept))}
          {hierarchyData.orphanProcesses && hierarchyData.orphanProcesses.length > 0 && (
            <TreeNode
              label={
                <StyledNode style={{ 
                  backgroundColor: '#95a5a6', 
                  color: 'white',
                  borderColor: '#7f8c8d'
                }}>
                  Unassigned Processes
                </StyledNode>
              }
            >
              {hierarchyData.orphanProcesses.map(process => renderProcessNode(process))}
            </TreeNode>
          )}
        </Tree>
      </div>

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
    </div>
  );
};

export default OrganizationalChart;
