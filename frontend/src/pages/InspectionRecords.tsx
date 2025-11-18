import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInspectionRecords,
  InspectionRecord,
  InspectionRecordFilters,
} from '../services/inspectionRecordService';
import { getEquipment, Equipment } from '../services/equipmentService';
import '../styles/InspectionRecords.css';

function InspectionRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters and search
  const [filters, setFilters] = useState<InspectionRecordFilters>({
    equipmentId: undefined,
    status: '',
    result: '',
    inspectionType: '',
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof InspectionRecord>('inspectionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsResponse, equipmentData] = await Promise.all([
        getInspectionRecords(filters),
        getEquipment(),
      ]);
      setRecords(recordsResponse.data);
      setEquipment(equipmentData);
      setTotalRecords(recordsResponse.pagination.total);
      setTotalPages(recordsResponse.pagination.pages);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inspection records');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof InspectionRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedRecords = () => {
    let sorted = [...records];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      sorted = sorted.filter(
        (record) =>
          record.equipmentName?.toLowerCase().includes(term) ||
          record.equipmentNumber?.toLowerCase().includes(term) ||
          record.inspectionType?.toLowerCase().includes(term) ||
          record.findings?.toLowerCase().includes(term)
      );
    }

    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const handleFilterChange = (key: keyof InspectionRecordFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'tw-badge tw-badge-success';
      case 'in_progress':
        return 'tw-badge tw-badge-warning';
      case 'scheduled':
        return 'tw-badge tw-badge-info';
      case 'overdue':
        return 'tw-badge tw-badge-danger';
      case 'cancelled':
        return 'tw-badge tw-badge-secondary';
      default:
        return 'tw-badge tw-badge-secondary';
    }
  };

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'passed':
        return 'tw-badge tw-badge-success';
      case 'passed_with_observations':
        return 'tw-badge tw-badge-info';
      case 'failed':
        return 'tw-badge tw-badge-danger';
      case 'conditional':
        return 'tw-badge tw-badge-warning';
      case 'pending':
        return 'tw-badge tw-badge-secondary';
      default:
        return 'tw-badge tw-badge-secondary';
    }
  };

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'tw-badge tw-badge-danger';
      case 'major':
        return 'tw-badge tw-badge-warning';
      case 'moderate':
        return 'tw-badge tw-badge-info';
      case 'minor':
        return 'tw-badge tw-badge-secondary';
      case 'none':
        return 'tw-badge tw-badge-success';
      default:
        return 'tw-badge tw-badge-secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const sortedRecords = getSortedRecords();

  if (loading) {
    return <div className="loading">Loading inspection records...</div>;
  }

  return (
    <div className="inspection-records-page">
      <div className="page-header">
        <h1>Inspection Records</h1>
        <p className="page-description">View and manage equipment inspection records</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="controls-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by equipment, inspection type, or findings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={filters.equipmentId || ''}
            onChange={(e) => handleFilterChange('equipmentId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="filter-select"
          >
            <option value="">All Equipment</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.equipmentNumber} - {eq.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.result || ''}
            onChange={(e) => handleFilterChange('result', e.target.value)}
            className="filter-select"
          >
            <option value="">All Results</option>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="passed_with_observations">Passed with Observations</option>
            <option value="failed">Failed</option>
            <option value="conditional">Conditional</option>
          </select>

          <input
            type="text"
            placeholder="Inspection Type"
            value={filters.inspectionType || ''}
            onChange={(e) => handleFilterChange('inspectionType', e.target.value)}
            className="filter-input"
          />

          <button onClick={() => {
            setFilters({ page: 1, limit: 20 });
            setSearchTerm('');
          }} className="tw-btn tw-btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      <div className="records-summary">
        <p>
          Showing {sortedRecords.length} of {totalRecords} records
          {filters.page && ` (Page ${filters.page} of ${totalPages})`}
        </p>
      </div>

      <div className="table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('equipmentNumber')} className="sortable">
                Equipment {sortField === 'equipmentNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('inspectionDate')} className="sortable">
                Inspection Date {sortField === 'inspectionDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Inspection Type</th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('result')} className="sortable">
                Result {sortField === 'result' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('severity')} className="sortable">
                Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Inspected By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-records">
                  No inspection records found
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="equipment-info">
                      <strong>{record.equipmentNumber}</strong>
                      <div className="equipment-name">{record.equipmentName}</div>
                    </div>
                  </td>
                  <td>{formatDate(record.inspectionDate)}</td>
                  <td>{record.inspectionType}</td>
                  <td>
                    <span className={getStatusBadgeClass(record.status)}>
                      {record.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={getResultBadgeClass(record.result)}>
                      {record.result.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {record.severity && (
                      <span className={getSeverityBadgeClass(record.severity)}>
                        {record.severity.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td>{record.inspectedByName || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/inspection-records/${record.id}`)}
                      className="tw-btn tw-btn-small tw-btn-primary"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange((filters.page || 1) - 1)}
            disabled={filters.page === 1}
            className="tw-btn tw-btn-secondary"
          >
            Previous
          </button>
          <span className="page-info">
            Page {filters.page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange((filters.page || 1) + 1)}
            disabled={filters.page === totalPages}
            className="tw-btn tw-btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default InspectionRecords;
