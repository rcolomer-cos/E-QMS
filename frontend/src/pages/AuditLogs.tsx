import { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/auditLogService';
import { getUsers } from '../services/userService';
import { AuditLogEntry, User, AuditLogFilters } from '../types';
import '../styles/AuditLogs.css';

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedSuccess, setSelectedSuccess] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  // Expanded row state for viewing details
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN', 'COMPLETE', 'VERIFY'];
  const actionCategories = ['NCR', 'CAPA', 'DOCUMENT', 'USER_MANAGEMENT', 'EQUIPMENT', 'DEPARTMENT', 'AUDIT', 'TRAINING'];
  const entityTypes = ['NCR', 'CAPA', 'Document', 'User', 'Equipment', 'Department', 'Audit', 'Training'];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, selectedUserId, selectedAction, selectedActionCategory, selectedEntityType, selectedSuccess, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users if not already loaded
      if (users.length === 0) {
        const usersData = await getUsers();
        setUsers(usersData);
      }

      const filters: AuditLogFilters = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (selectedUserId) filters.userId = parseInt(selectedUserId, 10);
      if (selectedAction) filters.action = selectedAction;
      if (selectedActionCategory) filters.actionCategory = selectedActionCategory;
      if (selectedEntityType) filters.entityType = selectedEntityType;
      if (selectedSuccess !== '') filters.success = selectedSuccess === 'true';
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await getAuditLogs(filters);
      setLogs(response.data);
      setTotalItems(response.pagination.total);
      setError('');
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedUserId('');
    setSelectedAction('');
    setSelectedActionCategory('');
    setSelectedEntityType('');
    setSelectedSuccess('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (jsonString?: string) => {
    if (!jsonString) return 'N/A';
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const toggleRowExpansion = (logId: number) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const getUserName = (userId?: number) => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user ? user.username : `User #${userId}`;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading && logs.length === 0) {
    return <div className="loading">Loading audit logs...</div>;
  }

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <div>
          <h1>Audit Log History</h1>
          <p className="subtitle">View and filter system audit logs</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>User</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} - {user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Action</label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Module</label>
            <select
              value={selectedActionCategory}
              onChange={(e) => {
                setSelectedActionCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Modules</option>
              {actionCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Entity Type</label>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Types</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={selectedSuccess}
              onChange={(e) => {
                setSelectedSuccess(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Items per page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleClearFilters} className="btn-clear-filters">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="table-container">
        <table className="audit-logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Entity</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr key={log.id} className="log-row">
                    <td>{formatDate(log.timestamp)}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{log.userName || getUserName(log.userId)}</div>
                        {log.userEmail && <div className="user-email">{log.userEmail}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`action-badge action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="category-badge">{log.actionCategory}</span>
                    </td>
                    <td>
                      <div className="entity-info">
                        <div className="entity-type">{log.entityType}</div>
                        {log.entityIdentifier && (
                          <div className="entity-identifier">{log.entityIdentifier}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${log.success ? 'success' : 'failed'}`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleRowExpansion(log.id)}
                        className="btn-details"
                      >
                        {expandedRow === log.id ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className="expanded-row">
                      <td colSpan={7}>
                        <div className="log-details">
                          <div className="details-grid">
                            <div className="detail-section">
                              <h4>Action Details</h4>
                              <div className="detail-item">
                                <strong>Description:</strong> {log.actionDescription || 'N/A'}
                              </div>
                              <div className="detail-item">
                                <strong>Request Method:</strong> {log.requestMethod || 'N/A'}
                              </div>
                              <div className="detail-item">
                                <strong>Request URL:</strong> {log.requestUrl || 'N/A'}
                              </div>
                              <div className="detail-item">
                                <strong>IP Address:</strong> {log.ipAddress || 'N/A'}
                              </div>
                              <div className="detail-item">
                                <strong>Status Code:</strong> {log.statusCode || 'N/A'}
                              </div>
                              {log.errorMessage && (
                                <div className="detail-item error">
                                  <strong>Error:</strong> {log.errorMessage}
                                </div>
                              )}
                            </div>

                            {(log.oldValues || log.newValues || log.changedFields) && (
                              <div className="detail-section">
                                <h4>Change Details</h4>
                                {log.changedFields && (
                                  <div className="detail-item">
                                    <strong>Changed Fields:</strong> {log.changedFields}
                                  </div>
                                )}
                                {log.oldValues && (
                                  <div className="detail-item">
                                    <strong>Old Values:</strong>
                                    <pre className="json-display">{formatJson(log.oldValues)}</pre>
                                  </div>
                                )}
                                {log.newValues && (
                                  <div className="detail-item">
                                    <strong>New Values:</strong>
                                    <pre className="json-display">{formatJson(log.newValues)}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Showing {logs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </div>
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="btn-page"
          >
            ««
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-page"
          >
            ‹
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="btn-page"
          >
            ›
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="btn-page"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
