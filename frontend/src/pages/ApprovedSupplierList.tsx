import { useState, useEffect } from 'react';
import {
  getSuppliers,
  getCategories,
  exportSuppliers,
  Supplier,
  SupplierFilters,
} from '../services/aslService';
import '../styles/ApprovedSupplierList.css';

function ApprovedSupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [limit] = useState(50);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('approved');
  const [performanceRatingFilter, setPerformanceRatingFilter] = useState<string>('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [criticalSupplierFilter, setCriticalSupplierFilter] = useState<string>('');
  const [preferredSupplierFilter, setPreferredSupplierFilter] = useState<string>('');

  // Sort state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    categoryFilter,
    approvalStatusFilter,
    performanceRatingFilter,
    riskLevelFilter,
    searchTerm,
    criticalSupplierFilter,
    preferredSupplierFilter,
    sortBy,
    sortOrder,
  ]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: SupplierFilters = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
      };

      if (categoryFilter) filters.category = categoryFilter;
      if (approvalStatusFilter) filters.approvalStatus = approvalStatusFilter;
      if (performanceRatingFilter) {
        const rating = parseInt(performanceRatingFilter, 10);
        filters.minRating = rating;
      }
      if (riskLevelFilter) filters.riskLevel = riskLevelFilter;
      if (searchTerm) filters.searchTerm = searchTerm;
      if (criticalSupplierFilter === 'true') filters.criticalSupplier = true;
      if (criticalSupplierFilter === 'false') filters.criticalSupplier = false;
      if (preferredSupplierFilter === 'true') filters.preferredSupplier = true;
      if (preferredSupplierFilter === 'false') filters.preferredSupplier = false;

      const data = await getSuppliers(filters);
      setSuppliers(data.suppliers);
      setTotalPages(data.totalPages);
      setTotalSuppliers(data.total);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const filters: SupplierFilters = {};

      if (categoryFilter) filters.category = categoryFilter;
      if (approvalStatusFilter) filters.approvalStatus = approvalStatusFilter;
      if (performanceRatingFilter) {
        const rating = parseInt(performanceRatingFilter, 10);
        filters.minRating = rating;
      }
      if (riskLevelFilter) filters.riskLevel = riskLevelFilter;
      if (searchTerm) filters.searchTerm = searchTerm;
      if (criticalSupplierFilter === 'true') filters.criticalSupplier = true;
      if (criticalSupplierFilter === 'false') filters.criticalSupplier = false;
      if (preferredSupplierFilter === 'true') filters.preferredSupplier = true;
      if (preferredSupplierFilter === 'false') filters.preferredSupplier = false;

      const blob = await exportSuppliers(filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `approved-suppliers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export suppliers');
      console.error('Error exporting suppliers:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setApprovalStatusFilter('approved');
    setPerformanceRatingFilter('');
    setRiskLevelFilter('');
    setSearchTerm('');
    setCriticalSupplierFilter('');
    setPreferredSupplierFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const getRiskBadgeClass = (riskLevel: string | undefined) => {
    if (!riskLevel) return 'badge-risk-none';
    const riskMap: Record<string, string> = {
      Low: 'badge-risk-low',
      Medium: 'badge-risk-medium',
      High: 'badge-risk-high',
      Critical: 'badge-risk-critical',
    };
    return riskMap[riskLevel] || 'badge-risk-none';
  };

  const getGradeBadgeClass = (grade: string | undefined) => {
    if (!grade) return 'badge-grade-none';
    const gradeMap: Record<string, string> = {
      A: 'badge-grade-a',
      B: 'badge-grade-b',
      C: 'badge-grade-c',
      D: 'badge-grade-d',
      F: 'badge-grade-f',
    };
    return gradeMap[grade] || 'badge-grade-none';
  };

  const getApprovalBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      approved: 'badge-approved',
      pending: 'badge-pending',
      under_review: 'badge-review',
      conditional_approval: 'badge-conditional',
      rejected: 'badge-rejected',
      suspended: 'badge-suspended',
      deactivated: 'badge-deactivated',
    };
    return statusMap[status] || 'badge-pending';
  };

  if (loading && suppliers.length === 0) {
    return <div className="page"><div className="loading">Loading suppliers...</div></div>;
  }

  return (
    <div className="approved-supplier-list">
      <div className="page-header">
        <h1>Approved Supplier List (ASL)</h1>
        <button 
          className="btn-primary" 
          onClick={handleExport}
          disabled={exporting || suppliers.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters Section */}
      <div className="filters-section">
        <h3>Filter Suppliers</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Name, number, contact, email..."
            />
          </div>

          <div className="filter-group">
            <label>Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Approval Status:</label>
            <select
              value={approvalStatusFilter}
              onChange={(e) => {
                setApprovalStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="conditional_approval">Conditional Approval</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Minimum Rating:</label>
            <select
              value={performanceRatingFilter}
              onChange={(e) => {
                setPerformanceRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Any Rating</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Risk Level:</label>
            <select
              value={riskLevelFilter}
              onChange={(e) => {
                setRiskLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Critical Supplier:</label>
            <select
              value={criticalSupplierFilter}
              onChange={(e) => {
                setCriticalSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Preferred Supplier:</label>
            <select
              value={preferredSupplierFilter}
              onChange={(e) => {
                setPreferredSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="filter-group filter-actions">
            <button className="btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {suppliers.length} of {totalSuppliers} supplier{totalSuppliers !== 1 ? 's' : ''}
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </p>
      </div>

      {/* Suppliers Table */}
      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('supplierNumber')}>
                  Supplier # {sortBy === 'supplierNumber' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Category</th>
                <th>Approval Status</th>
                <th>Risk Level</th>
                <th className="sortable" onClick={() => handleSort('rating')}>
                  Rating {sortBy === 'rating' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('performanceScore')}>
                  Performance {sortBy === 'performanceScore' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Quality Grade</th>
                <th>Contact</th>
                <th className="sortable" onClick={() => handleSort('lastEvaluationDate')}>
                  Last Evaluation {sortBy === 'lastEvaluationDate' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="no-data">
                    No suppliers match the current filters
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.supplierNumber}</td>
                    <td>
                      <div className="supplier-name-cell">
                        <span className="supplier-name">{supplier.name}</span>
                        <div className="supplier-badges">
                          {supplier.criticalSupplier && (
                            <span className="badge badge-critical">Critical</span>
                          )}
                          {supplier.preferredSupplier && (
                            <span className="badge badge-preferred">Preferred</span>
                          )}
                          {supplier.iso9001Certified && (
                            <span className="badge badge-iso">ISO 9001</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{supplier.category}</td>
                    <td>
                      <span className={`badge ${getApprovalBadgeClass(supplier.approvalStatus)}`}>
                        {supplier.approvalStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {supplier.riskLevel ? (
                        <span className={`badge ${getRiskBadgeClass(supplier.riskLevel)}`}>
                          {supplier.riskLevel}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {supplier.rating !== null && supplier.rating !== undefined ? (
                        <span className="rating-display">
                          {'★'.repeat(supplier.rating)}
                          {'☆'.repeat(5 - supplier.rating)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {supplier.performanceScore !== null && supplier.performanceScore !== undefined
                        ? `${supplier.performanceScore.toFixed(1)}`
                        : 'N/A'}
                    </td>
                    <td>
                      {supplier.qualityGrade ? (
                        <span className={`badge ${getGradeBadgeClass(supplier.qualityGrade)}`}>
                          {supplier.qualityGrade}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <div className="contact-cell">
                        {supplier.contactPerson && (
                          <div className="contact-name">{supplier.contactPerson}</div>
                        )}
                        {supplier.email && (
                          <div className="contact-email">{supplier.email}</div>
                        )}
                        {supplier.phone && (
                          <div className="contact-phone">{supplier.phone}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {supplier.lastEvaluationDate
                        ? new Date(supplier.lastEvaluationDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ApprovedSupplierList;
