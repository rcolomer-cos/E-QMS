import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getWorkRoles,
  deleteWorkRole,
  getCategories,
  getLevels,
  WorkRole,
  WorkRoleFilters,
} from '../services/workRoleService';
import { getDepartments } from '../services/departmentService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/WorkRoles.css';

function WorkRoles() {
  const navigate = useNavigate();
  const toast = useToast();
  const [workRoles, setWorkRoles] = useState<WorkRole[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sort state
  const [sortBy, setSortBy] = useState<string>('displayOrder');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  useEffect(() => {
    loadCurrentUser();
    loadCategories();
    loadLevels();
    loadDepartments();
  }, []);

  useEffect(() => {
    loadWorkRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, levelFilter, departmentFilter, searchTerm, sortBy, sortOrder]);

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  const hasRole = (roleNames: string[]) => {
    if (!currentUser) return false;
    const userRoles = currentUser.roleNames || [];
    if (userRoles.length > 0) {
      return roleNames.some(role => userRoles.map((r: string) => r.toLowerCase()).includes(role.toLowerCase()));
    }
    if (currentUser.roles && currentUser.roles.length > 0) {
      const roleNamesFromRoles = currentUser.roles.map((r: any) => r.name.toLowerCase());
      return roleNames.some(role => roleNamesFromRoles.includes(role.toLowerCase()));
    }
    if (currentUser.role) {
      return roleNames.some(role => role.toLowerCase() === currentUser.role?.toLowerCase());
    }
    return false;
  };

  const canManageWorkRoles = hasRole(['superuser', 'manager']);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadLevels = async () => {
    try {
      const data = await getLevels();
      setLevels(data);
    } catch (err) {
      console.error('Error loading levels:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      // getDepartments returns array directly or wrapped object
      setDepartments(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadWorkRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: WorkRoleFilters = {
        sortBy,
        sortOrder,
      };

      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;
      if (levelFilter) filters.level = levelFilter;
      if (departmentFilter) filters.departmentId = parseInt(departmentFilter, 10);
      if (searchTerm) filters.searchTerm = searchTerm;

      const data = await getWorkRoles(filters);
      setWorkRoles(data.workRoles);
    } catch (err) {
      setError('Failed to load work roles');
      console.error('Error loading work roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workRole: WorkRole) => {
    if (!window.confirm(`Are you sure you want to delete "${workRole.name}"?`)) {
      return;
    }

    try {
      await deleteWorkRole(workRole.id!);
      toast.success('Work role deleted successfully');
      loadWorkRoles();
    } catch (err: any) {
      console.error('Error deleting work role:', err);
      toast.error(err.response?.data?.error || 'Failed to delete work role');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕';
    return sortOrder === 'ASC' ? '↑' : '↓';
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'archived':
        return 'badge-secondary';
      default:
        return '';
    }
  };

  return (
    <div className="page work-roles-page">
      <div className="page-header">
        <div>
          <h1>Work Roles</h1>
          <p className="page-description">
            Manage job/work roles and their requirements for the competence matrix
          </p>
          {!canManageWorkRoles && (
            <p className="rbac-notice">
              ℹ️ View-only access. Only Managers and Superusers can add, edit, or delete work roles.
            </p>
          )}
        </div>
        <div className="header-actions">
          {canManageWorkRoles && (
            <button className="btn-primary" onClick={() => navigate('/work-roles/add')}>
              + Add Work Role
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Level</label>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Department</label>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <button
              className="btn-secondary"
              onClick={() => {
                setStatusFilter('active');
                setCategoryFilter('');
                setLevelFilter('');
                setDepartmentFilter('');
                setSearchTerm('');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>{workRoles.length} work role{workRoles.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Loading work roles...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : workRoles.length === 0 ? (
        <div className="no-data">
          <p>No work roles found</p>
          {canManageWorkRoles && (
            <button className="btn-primary" onClick={() => navigate('/work-roles/add')}>
              Create First Work Role
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name {getSortIcon('name')}
                </th>
                <th onClick={() => handleSort('code')} style={{ cursor: 'pointer' }}>
                  Code {getSortIcon('code')}
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  Category {getSortIcon('category')}
                </th>
                <th onClick={() => handleSort('level')} style={{ cursor: 'pointer' }}>
                  Level {getSortIcon('level')}
                </th>
                <th>Department</th>
                <th>Status</th>
                <th>Experience Required</th>
                <th onClick={() => handleSort('displayOrder')} style={{ cursor: 'pointer' }}>
                  Display Order {getSortIcon('displayOrder')}
                </th>
                {canManageWorkRoles && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {workRoles.map((workRole) => (
                <tr key={workRole.id}>
                  <td>
                    <strong>{workRole.name}</strong>
                    {workRole.description && (
                      <div className="description-preview">
                        {workRole.description.length > 100
                          ? `${workRole.description.substring(0, 100)}...`
                          : workRole.description}
                      </div>
                    )}
                  </td>
                  <td>{workRole.code || '-'}</td>
                  <td>{workRole.category || '-'}</td>
                  <td>{workRole.level || '-'}</td>
                  <td>{workRole.departmentName || '-'}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(workRole.status)}`}>
                      {workRole.status}
                    </span>
                  </td>
                  <td>
                    {workRole.experienceYears ? `${workRole.experienceYears} years` : '-'}
                  </td>
                  <td>{workRole.displayOrder}</td>
                  {canManageWorkRoles && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => navigate(`/work-roles/edit/${workRole.id}`)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(workRole)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WorkRoles;
