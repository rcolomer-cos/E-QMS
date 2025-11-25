import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSuppliers,
  getCategories,
  getSupplierTypes,
  getIndustries,
  exportSuppliers,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  Supplier,
  SupplierFilters,
} from '../services/aslService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/ApprovedSupplierList.css';

function ApprovedSupplierList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [supplierTypes, setSupplierTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [limit] = useState(50);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('');
  const [performanceRatingFilter, setPerformanceRatingFilter] = useState<string>('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [criticalSupplierFilter, setCriticalSupplierFilter] = useState<string>('');
  const [preferredSupplierFilter, setPreferredSupplierFilter] = useState<string>('');

  // Sort state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  useEffect(() => {
    loadCurrentUser();
    loadCategories();
    loadSupplierTypes();
    loadIndustries();
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

  const canManageSuppliers = hasRole(['superuser', 'admin', 'manager']);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadSupplierTypes = async () => {
    try {
      const data = await getSupplierTypes();
      setSupplierTypes(data);
    } catch (err) {
      console.error('Error loading supplier types:', err);
    }
  };

  const loadIndustries = async () => {
    try {
      const data = await getIndustries();
      setIndustries(data);
    } catch (err) {
      console.error('Error loading industries:', err);
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
    setApprovalStatusFilter('');
    setPerformanceRatingFilter('');
    setRiskLevelFilter('');
    setSearchTerm('');
    setCriticalSupplierFilter('');
    setPreferredSupplierFilter('');
    setCurrentPage(1);
  };

  const handleAddSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      setSaving(true);
      await createSupplier(supplierData);
      toast.showCreateSuccess('Supplier');
      setShowAddModal(false);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create supplier');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleEditSupplier = async (supplierData: Partial<Supplier>) => {
    if (!editingSupplier) return;
    try {
      setSaving(true);
      await updateSupplier(editingSupplier.id, supplierData);
      toast.showUpdateSuccess('Supplier');
      setShowEditModal(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update supplier');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!confirm('Are you sure you want to deactivate this supplier?')) return;
    try {
      await deactivateSupplier(supplierId);
      toast.success('Supplier deactivated successfully');
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deactivate supplier');
    }
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {canManageSuppliers && (
            <button 
              className="btn-primary" 
              onClick={() => navigate('/approved-supplier-list/add')}
            >
              + Add Supplier
            </button>
          )}
          <button 
            className="btn-secondary" 
            onClick={handleExport}
            disabled={exporting || suppliers.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
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
                <th>Quality Grade</th>
                <th>Contact</th>
                <th className="sortable" onClick={() => handleSort('lastEvaluationDate')}>
                  Last Evaluation {sortBy === 'lastEvaluationDate' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                {canManageSuppliers && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={canManageSuppliers ? 10 : 9} className="no-data">
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
                    {canManageSuppliers && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-edit"
                            onClick={() => navigate(`/approved-supplier-list/edit/${supplier.id}`)}
                            title="Edit Supplier"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            title="Deactivate Supplier"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
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

      {/* Add Supplier Modal */}
      {showAddModal && (
        <SupplierFormModal
          mode="add"
          categories={categories}
          supplierTypes={supplierTypes}
          industries={industries}
          onSubmit={handleAddSupplier}
          onCancel={() => setShowAddModal(false)}
          saving={saving}
        />
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && editingSupplier && (
        <SupplierFormModal
          mode="edit"
          supplier={editingSupplier}
          categories={categories}
          supplierTypes={supplierTypes}
          industries={industries}
          onSubmit={handleEditSupplier}
          onCancel={() => {
            setShowEditModal(false);
            setEditingSupplier(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

// Supplier Form Modal Component
interface SupplierFormModalProps {
  mode: 'add' | 'edit';
  supplier?: Supplier;
  categories: string[];
  supplierTypes: string[];
  industries: string[];
  onSubmit: (data: Partial<Supplier>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function SupplierFormModal({
  mode,
  supplier,
  categories,
  supplierTypes,
  industries,
  onSubmit,
  onCancel,
  saving,
}: SupplierFormModalProps) {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: supplier?.name || '',
    description: supplier?.description || '',
    category: supplier?.category || categories[0] || '',
    supplierType: supplier?.supplierType || '',
    industry: supplier?.industry || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    website: supplier?.website || '',
    addressLine1: supplier?.addressLine1 || '',
    city: supplier?.city || '',
    country: supplier?.country || '',
    approvalStatus: supplier?.approvalStatus || 'pending',
    productsServices: supplier?.productsServices || '',
    riskLevel: supplier?.riskLevel || 'Low',
    criticalSupplier: supplier?.criticalSupplier || false,
    preferredSupplier: supplier?.preferredSupplier || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>{mode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}</h2>
          <button className="close-button" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Supplier Type</label>
                <select
                  name="supplierType"
                  value={formData.supplierType}
                  onChange={handleChange}
                >
                  <option value="">Select Type</option>
                  {supplierTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                >
                  <option value="">Select Industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Street Address"
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Risk Level</label>
                <select
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Approval Status</label>
                <select
                  name="approvalStatus"
                  value={formData.approvalStatus}
                  onChange={handleChange}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="conditional_approval">Conditional Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="criticalSupplier"
                    checked={formData.criticalSupplier || false}
                    onChange={handleChange}
                  />
                  {' '}Critical Supplier
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="preferredSupplier"
                    checked={formData.preferredSupplier || false}
                    onChange={handleChange}
                  />
                  {' '}Preferred Supplier
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Products/Services</label>
              <textarea
                name="productsServices"
                value={formData.productsServices}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : mode === 'add' ? 'Add Supplier' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApprovedSupplierList;
