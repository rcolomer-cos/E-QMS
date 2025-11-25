import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllAssignments,
  deleteAssignment,
  UserWorkRoleWithDetails,
  UserWorkRoleFilters,
  getStatistics,
  UserWorkRoleStatistics,
} from '../services/userWorkRoleService';
import { getUsers } from '../services/userService';
import { getWorkRoles } from '../services/workRoleService';
import { getSkillLevels } from '../services/skillLevelService';
import { getDepartments } from '../services/departmentService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/UserWorkRoleAssignments.css';

function UserWorkRoleAssignments() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [assignments, setAssignments] = useState<UserWorkRoleWithDetails[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workRoles, setWorkRoles] = useState<any[]>([]);
  const [skillLevels, setSkillLevels] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<UserWorkRoleStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [userFilter, setUserFilter] = useState<string>('');
  const [workRoleFilter, setWorkRoleFilter] = useState<string>('');
  const [skillLevelFilter, setSkillLevelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showStatistics, setShowStatistics] = useState(true);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadWorkRoles();
    loadSkillLevels();
    loadDepartments();
  }, []);

  useEffect(() => {
    loadAssignments();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilter, workRoleFilter, skillLevelFilter, statusFilter, departmentFilter, verifiedFilter]);

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  const hasRole = (user: any, roleNames: string[]) => {
    if (!user) return false;
    const userRoles = user.roleNames || [];
    if (userRoles.length > 0) {
      return roleNames.some(role => userRoles.map((r: string) => r.toLowerCase()).includes(role.toLowerCase()));
    }
    if (user.roles && user.roles.length > 0) {
      const roleNamesFromRoles = user.roles.map((r: any) => r.name.toLowerCase());
      return roleNames.some(role => roleNamesFromRoles.includes(role.toLowerCase()));
    }
    if (user.role) {
      return roleNames.some(role => role.toLowerCase() === user.role?.toLowerCase());
    }
    return false;
  };

  const canManage = hasRole(currentUser, ['superuser', 'manager']);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadWorkRoles = async () => {
    try {
      const data = await getWorkRoles({});
      setWorkRoles(Array.isArray(data) ? data : (data.workRoles || []));
    } catch (error) {
      console.error('Error loading work roles:', error);
      setWorkRoles([]);
    }
  };

  const loadSkillLevels = async () => {
    try {
      const data = await getSkillLevels();
      setSkillLevels(Array.isArray(data) ? data : data.skillLevels || []);
    } catch (error) {
      console.error('Error loading skill levels:', error);
      setSkillLevels([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const filters: UserWorkRoleFilters = {};
      
      if (userFilter) filters.userId = parseInt(userFilter);
      if (workRoleFilter) filters.workRoleId = parseInt(workRoleFilter);
      if (skillLevelFilter) filters.skillLevelId = parseInt(skillLevelFilter);
      if (statusFilter) filters.status = statusFilter;
      if (departmentFilter) filters.departmentId = parseInt(departmentFilter);
      if (verifiedFilter) filters.verified = verifiedFilter === 'true';

      const data = await getAllAssignments(filters);
      setAssignments(data);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load user work role assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const filters: UserWorkRoleFilters = {};
      if (userFilter) filters.userId = parseInt(userFilter);
      if (workRoleFilter) filters.workRoleId = parseInt(workRoleFilter);
      if (departmentFilter) filters.departmentId = parseInt(departmentFilter);

      const data = await getStatistics(filters);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this work role assignment?')) {
      return;
    }

    try {
      await deleteAssignment(id);
      toast.success('Work role assignment removed successfully');
      loadAssignments();
      loadStatistics();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove work role assignment');
    }
  };

  const handleClearFilters = () => {
    setUserFilter('');
    setWorkRoleFilter('');
    setSkillLevelFilter('');
    setStatusFilter('active');
    setDepartmentFilter('');
    setVerifiedFilter('');
    setSearchTerm('');
  };

  const getFilteredAssignments = () => {
    if (!searchTerm) return assignments;

    const term = searchTerm.toLowerCase();
    return assignments.filter(assignment =>
      assignment.userFirstName?.toLowerCase().includes(term) ||
      assignment.userLastName?.toLowerCase().includes(term) ||
      assignment.userEmail?.toLowerCase().includes(term) ||
      assignment.workRoleName?.toLowerCase().includes(term) ||
      assignment.workRoleCode?.toLowerCase().includes(term)
    );
  };

  const filteredAssignments = getFilteredAssignments();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'inactive':
        return 'status-badge status-inactive';
      case 'expired':
        return 'status-badge status-expired';
      case 'pending':
        return 'status-badge status-pending';
      case 'suspended':
        return 'status-badge status-suspended';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatTenure = (assignment: UserWorkRoleWithDetails) => {
    const years = assignment.yearsInRole || 0;
    const months = assignment.monthsInRole || 0;
    const days = assignment.daysInRole || 0;

    if (years > 0) {
      const remainingMonths = months % 12;
      if (remainingMonths > 0) {
        return `${years}y ${remainingMonths}m`;
      }
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    return 'New';
  };

  if (!canManage) {
    return (
      <div className="user-work-roles-page">
        <div className="page-header">
          <h1>User Work Role Assignments</h1>
        </div>
        <div className="access-denied">
          <p>You do not have permission to manage user work role assignments.</p>
          <p>Only users with SUPERUSER or MANAGER roles can access this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-work-roles-page">
      <div className="page-header">
        <div className="header-content">
          <h1>User Work Role Assignments</h1>
          <p className="subtitle">Manage work role assignments and skill levels for users</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/user-work-roles/assign')}
          >
            + Assign Work Role
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStatistics && statistics && (
        <div className="statistics-section">
          <div className="statistics-header">
            <h2>Overview Statistics</h2>
            <button
              className="btn-icon"
              onClick={() => setShowStatistics(false)}
              title="Hide statistics"
            >
              ×
            </button>
          </div>
          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalAssignments}</div>
              <div className="stat-label">Total Assignments</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.activeAssignments}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.expiredAssignments}</div>
              <div className="stat-label">Expired</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.pendingVerification}</div>
              <div className="stat-label">Pending Verification</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.trainingRequired}</div>
              <div className="stat-label">Training Required</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.trainingCompleted}</div>
              <div className="stat-label">Training Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>User</label>
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Work Role</label>
            <select value={workRoleFilter} onChange={(e) => setWorkRoleFilter(e.target.value)}>
              <option value="">All Work Roles</option>
              {workRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Skill Level</label>
            <select value={skillLevelFilter} onChange={(e) => setSkillLevelFilter(e.target.value)}>
              <option value="">All Levels</option>
              {skillLevels.map(level => (
                <option key={level.id} value={level.id}>
                  Level {level.level} - {level.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Department</label>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Verified</label>
            <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
        </div>

        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by user name, email, or work role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={handleClearFilters}>
            Clear Filters
          </button>
          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              ☰
            </button>
            <button
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
              title="Card view"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="content-section">
        {loading ? (
          <div className="loading">Loading assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="empty-state">
            <p>No work role assignments found.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/user-work-roles/assign')}
            >
              Assign First Work Role
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="table-container">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Work Role</th>
                  <th>Skill Level</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Time in Role</th>
                  <th>Assigned Date</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(assignment => (
                  <tr key={assignment.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">
                          {assignment.userFirstName} {assignment.userLastName}
                        </div>
                        <div className="user-email">{assignment.userEmail}</div>
                      </div>
                    </td>
                    <td>
                      <div className="work-role-info">
                        <div className="work-role-name">{assignment.workRoleName}</div>
                        <div className="work-role-code">{assignment.workRoleCode}</div>
                      </div>
                    </td>
                    <td>
                      {assignment.skillLevel ? (
                        <div className="skill-level">
                          <span className={`skill-badge skill-level-${assignment.skillLevel}`}>
                            Level {assignment.skillLevel}
                          </span>
                          <span className="skill-name">{assignment.skillLevelName}</span>
                        </div>
                      ) : (
                        <span className="no-data">Not Set</span>
                      )}
                    </td>
                    <td>{assignment.workRoleDepartmentName || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadgeClass(assignment.status)}>
                        {assignment.status}
                      </span>
                      {assignment.isExpired && (
                        <span className="expired-indicator" title="Expired">
                          ⚠
                        </span>
                      )}
                    </td>
                    <td>
                      {assignment.verified ? (
                        <span className="verified-badge">✓ Verified</span>
                      ) : (
                        <span className="unverified-badge">Pending</span>
                      )}
                    </td>
                    <td>
                      <span className="tenure-display" title={`${assignment.daysInRole || 0} days total`}>
                        {formatTenure(assignment)}
                      </span>
                    </td>
                    <td>{formatDate(assignment.assignedDate)}</td>
                    <td>
                      {assignment.expiryDate ? (
                        <div>
                          {formatDate(assignment.expiryDate)}
                          {assignment.daysUntilExpiry !== null && assignment.daysUntilExpiry >= 0 && (
                            <div className="days-remaining">
                              ({assignment.daysUntilExpiry} days)
                            </div>
                          )}
                        </div>
                      ) : (
                        'No Expiry'
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/user-work-roles/edit/${assignment.id}`)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(assignment.id!)}
                        title="Remove"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="assignment-card">
                <div className="card-header">
                  <h3>
                    {assignment.userFirstName} {assignment.userLastName}
                  </h3>
                  <span className={getStatusBadgeClass(assignment.status)}>
                    {assignment.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="label">Email:</span>
                    <span className="value">{assignment.userEmail}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Work Role:</span>
                    <span className="value">{assignment.workRoleName}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Code:</span>
                    <span className="value">{assignment.workRoleCode}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Skill Level:</span>
                    <span className="value">
                      {assignment.skillLevel ? (
                        <>
                          <span className={`skill-badge skill-level-${assignment.skillLevel}`}>
                            Level {assignment.skillLevel}
                          </span>
                          {assignment.skillLevelName}
                        </>
                      ) : (
                        'Not Set'
                      )}
                    </span>
                  </div>
                  <div className="card-row">
                    <span className="label">Department:</span>
                    <span className="value">{assignment.workRoleDepartmentName || 'N/A'}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Verified:</span>
                    <span className="value">
                      {assignment.verified ? (
                        <span className="verified-badge">✓ Verified</span>
                      ) : (
                        <span className="unverified-badge">Pending</span>
                      )}
                    </span>
                  </div>
                  <div className="card-row">
                    <span className="label">Time in Role:</span>
                    <span className="value tenure-display" title={`${assignment.daysInRole || 0} days total`}>
                      {formatTenure(assignment)}
                    </span>
                  </div>
                  <div className="card-row">
                    <span className="label">Assigned:</span>
                    <span className="value">{formatDate(assignment.assignedDate)}</span>
                  </div>
                  {assignment.expiryDate && (
                    <div className="card-row">
                      <span className="label">Expires:</span>
                      <span className="value">
                        {formatDate(assignment.expiryDate)}
                        {assignment.daysUntilExpiry !== null && assignment.daysUntilExpiry >= 0 && (
                          <span className="days-remaining">
                            ({assignment.daysUntilExpiry} days)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/user-work-roles/edit/${assignment.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(assignment.id!)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="results-count">
        Showing {filteredAssignments.length} of {assignments.length} assignments
      </div>
    </div>
  );
}

export default UserWorkRoleAssignments;
