import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCalibrationRecords,
  CalibrationRecord,
  CalibrationRecordFilters,
} from '../services/calibrationRecordService';
import { getEquipment, Equipment } from '../services/equipmentService';
import '../styles/CalibrationRecords.css';

function CalibrationRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters and search
  const [filters, setFilters] = useState<CalibrationRecordFilters>({
    equipmentId: undefined,
    status: '',
    result: '',
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof CalibrationRecord>('calibrationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsResponse, equipmentData] = await Promise.all([
        getCalibrationRecords(filters),
        getEquipment(),
      ]);
      setRecords(recordsResponse.data);
      setEquipment(equipmentData);
      setTotalRecords(recordsResponse.pagination.total);
      setTotalPages(recordsResponse.pagination.pages);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load calibration records');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof CalibrationRecord) => {
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
          record.certificateNumber?.toLowerCase().includes(term) ||
          record.calibrationType?.toLowerCase().includes(term)
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

  const handleFilterChange = (key: keyof CalibrationRecordFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge badge-success';
      case 'in_progress':
        return 'badge badge-warning';
      case 'scheduled':
        return 'badge badge-info';
      case 'overdue':
        return 'badge badge-danger';
      case 'cancelled':
        return 'badge badge-secondary';
      default:
        return 'badge';
    }
  };

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'passed':
        return 'badge badge-success';
      case 'failed':
        return 'badge badge-danger';
      case 'conditional':
        return 'badge badge-warning';
      case 'pending':
        return 'badge badge-secondary';
      default:
        return 'badge';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const sortedRecords = getSortedRecords();

  if (loading) {
    return <div className="loading">Loading calibration records...</div>;
  }

  return (
    <div className="calibration-records-page">
      <div className="page-header">
        <h1>Calibration Records</h1>
        <p className="page-description">View and manage equipment calibration records</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="controls-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by equipment, certificate number, or calibration type..."
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
            <option value="failed">Failed</option>
            <option value="conditional">Conditional</option>
          </select>

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
              <th onClick={() => handleSort('calibrationDate')} className="sortable">
                Calibration Date {sortField === 'calibrationDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('nextDueDate')} className="sortable">
                Next Due Date {sortField === 'nextDueDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Calibration Type</th>
              <th>Certificate #</th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('result')} className="sortable">
                Result {sortField === 'result' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Performed By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-records">
                  No calibration records found
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
                  <td>{formatDate(record.calibrationDate)}</td>
                  <td>{formatDate(record.nextDueDate)}</td>
                  <td>{record.calibrationType || 'N/A'}</td>
                  <td>{record.certificateNumber || 'N/A'}</td>
                  <td>
                    <span className={getStatusBadgeClass(record.status)}>
                      {record.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={getResultBadgeClass(record.result)}>
                      {record.result.toUpperCase()}
                    </span>
                  </td>
                  <td>{record.performedByName || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/calibration-records/${record.id}`)}
                      className="tw-btn-small tw-btn-primary"
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

export default CalibrationRecords;
