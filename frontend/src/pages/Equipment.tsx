import { useState, useEffect } from 'react';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  regenerateQRCode,
  Equipment as EquipmentType,
} from '../services/equipmentService';
import { getUsers } from '../services/userService';
import { User } from '../types';
import '../styles/Equipment.css';

type ViewMode = 'list' | 'view' | 'add' | 'edit';

function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<EquipmentType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);

  // Filters and search
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    location: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof EquipmentType>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Form data
  const [formData, setFormData] = useState<Partial<EquipmentType>>({
    equipmentNumber: '',
    name: '',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    department: '',
    status: 'operational',
    purchaseDate: '',
    calibrationInterval: undefined,
    maintenanceInterval: undefined,
    responsiblePerson: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment, searchTerm, filters, sortField, sortDirection]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentData, usersData] = await Promise.all([
        getEquipment(),
        getUsers(),
      ]);
      setEquipment(equipmentData);
      setUsers(usersData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEquipment = () => {
    let filtered = [...equipment];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((e) => e.status === filters.status);
    }
    if (filters.department) {
      filtered = filtered.filter((e) => e.department === filters.department);
    }
    if (filters.location) {
      filtered = filtered.filter((e) => e.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.equipmentNumber.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.manufacturer?.toLowerCase().includes(term) ||
          e.model?.toLowerCase().includes(term) ||
          e.serialNumber?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredEquipment(filtered);
  };

  const handleSort = (field: keyof EquipmentType) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleView = async (id: number) => {
    try {
      const equipmentData = await getEquipmentById(id);
      setSelectedEquipment(equipmentData);
      setViewMode('view');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load equipment details');
    }
  };

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormData({
      equipmentNumber: '',
      name: '',
      description: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      department: '',
      status: 'operational',
      purchaseDate: '',
      calibrationInterval: undefined,
      maintenanceInterval: undefined,
      responsiblePerson: undefined,
    });
    setShowModal(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const equipmentData = await getEquipmentById(id);
      setEditingEquipment(equipmentData);
      setFormData({
        equipmentNumber: equipmentData.equipmentNumber,
        name: equipmentData.name,
        description: equipmentData.description || '',
        manufacturer: equipmentData.manufacturer || '',
        model: equipmentData.model || '',
        serialNumber: equipmentData.serialNumber || '',
        location: equipmentData.location,
        department: equipmentData.department || '',
        status: equipmentData.status,
        purchaseDate: equipmentData.purchaseDate ? equipmentData.purchaseDate.split('T')[0] : '',
        calibrationInterval: equipmentData.calibrationInterval,
        maintenanceInterval: equipmentData.maintenanceInterval,
        responsiblePerson: equipmentData.responsiblePerson,
      });
      setShowModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load equipment details');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      await deleteEquipment(id);
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete equipment');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEquipment(null);
    setFormData({
      equipmentNumber: '',
      name: '',
      description: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      department: '',
      status: 'operational',
      purchaseDate: '',
      calibrationInterval: undefined,
      maintenanceInterval: undefined,
      responsiblePerson: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id!, formData);
      } else {
        await createEquipment(formData as any);
      }
      handleCloseModal();
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save equipment');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEquipment(null);
  };

  const handleRegenerateQR = async (id: number) => {
    if (!window.confirm('Are you sure you want to regenerate the QR code for this equipment?')) {
      return;
    }

    try {
      const response = await regenerateQRCode(id);
      // Update the selected equipment with the new QR code
      if (selectedEquipment) {
        setSelectedEquipment({ ...selectedEquipment, qrCode: response.qrCode });
      }
      // Reload the equipment list
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate QR code');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getUniqueValues = (field: keyof EquipmentType) => {
    const values = equipment
      .map((e) => e[field])
      .filter((value, index, self) => value && self.indexOf(value) === index);
    return values as string[];
  };

  if (loading) {
    return <div className="loading">Loading equipment...</div>;
  }

  // View detailed equipment
  if (viewMode === 'view' && selectedEquipment) {
    return (
      <div className="equipment-page">
        <div className="detail-view">
          <div className="detail-header">
            <div className="detail-title">
              <h2>{selectedEquipment.name}</h2>
              <div className="detail-subtitle">
                Equipment Number: {selectedEquipment.equipmentNumber}
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-secondary" onClick={handleBackToList}>
                Back to List
              </button>
              <button className="btn-edit" onClick={() => handleEdit(selectedEquipment.id!)}>
                Edit
              </button>
            </div>
          </div>

          <div className="detail-body">
            {/* Status Alert */}
            {selectedEquipment.status === 'calibration_due' && (
              <div className="alert-banner alert-warning">
                ⚠ Calibration is due for this equipment
              </div>
            )}
            {selectedEquipment.status === 'out_of_service' && (
              <div className="alert-banner alert-danger">
                ⛔ This equipment is out of service
              </div>
            )}

            {/* Basic Information */}
            <div className="detail-section">
              <h3>Basic Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Equipment Number</span>
                  <span className="detail-value">{selectedEquipment.equipmentNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{selectedEquipment.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-${selectedEquipment.status}`}>
                    {getStatusLabel(selectedEquipment.status)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{selectedEquipment.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{selectedEquipment.department || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Purchase Date</span>
                  <span className="detail-value">{formatDate(selectedEquipment.purchaseDate)}</span>
                </div>
              </div>
              {selectedEquipment.description && (
                <div className="detail-item" style={{ marginTop: '1rem' }}>
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selectedEquipment.description}</span>
                </div>
              )}
            </div>

            {/* Manufacturer Information */}
            <div className="detail-section">
              <h3>Manufacturer Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Manufacturer</span>
                  <span className="detail-value">{selectedEquipment.manufacturer || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Model</span>
                  <span className="detail-value">{selectedEquipment.model || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Serial Number</span>
                  <span className="detail-value">{selectedEquipment.serialNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Calibration Information */}
            <div className="detail-section">
              <h3>Calibration Management</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Last Calibration</span>
                  <span className="detail-value">{formatDate(selectedEquipment.lastCalibrationDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Next Calibration</span>
                  <span className="detail-value">{formatDate(selectedEquipment.nextCalibrationDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Calibration Interval</span>
                  <span className="detail-value">
                    {selectedEquipment.calibrationInterval ? `${selectedEquipment.calibrationInterval} days` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Information */}
            <div className="detail-section">
              <h3>Maintenance Management</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Last Maintenance</span>
                  <span className="detail-value">{formatDate(selectedEquipment.lastMaintenanceDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Next Maintenance</span>
                  <span className="detail-value">{formatDate(selectedEquipment.nextMaintenanceDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Maintenance Interval</span>
                  <span className="detail-value">
                    {selectedEquipment.maintenanceInterval ? `${selectedEquipment.maintenanceInterval} days` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>QR Code</h3>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleRegenerateQR(selectedEquipment.id!)}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  Regenerate QR Code
                </button>
              </div>
              {selectedEquipment.qrCode ? (
                <div className="qr-code-container">
                  <img src={selectedEquipment.qrCode} alt="Equipment QR Code" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Scan this QR code to view equipment details
                  </p>
                </div>
              ) : (
                <div className="alert-banner alert-warning">
                  No QR code available. Click "Regenerate QR Code" to generate one.
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="detail-section">
              <h3>Audit Trail</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">{formatDate(selectedEquipment.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">{formatDate(selectedEquipment.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="equipment-page">
      <div className="page-header">
        <div>
          <h1>Equipment Management</h1>
          <p className="subtitle">Manage equipment, calibration, and maintenance tracking</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          Add Equipment
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, number, manufacturer, model, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
            <option value="calibration_due">Calibration Due</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {getUniqueValues('department').map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="filter-select"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('equipmentNumber')} style={{ cursor: 'pointer' }}>
                Equipment Number {sortField === 'equipmentNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('location')} style={{ cursor: 'pointer' }}>
                Location {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('nextCalibrationDate')} style={{ cursor: 'pointer' }}>
                Next Calibration {sortField === 'nextCalibrationDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {searchTerm || filters.status || filters.department || filters.location
                    ? 'No equipment match your filters'
                    : 'No equipment found'}
                </td>
              </tr>
            ) : (
              filteredEquipment.map((item) => (
                <tr key={item.id}>
                  <td>{item.equipmentNumber}</td>
                  <td>{item.name}</td>
                  <td>{item.location}</td>
                  <td>{item.department || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>{formatDate(item.nextCalibrationDate)}</td>
                  <td className="actions-cell">
                    <button className="btn-view" onClick={() => handleView(item.id!)}>
                      View
                    </button>
                    <button className="btn-edit" onClick={() => handleEdit(item.id!)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id!)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Equipment Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.equipmentNumber}
                      onChange={(e) => setFormData({ ...formData, equipmentNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Location <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Status <span className="required">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="operational">Operational</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out_of_service">Out of Service</option>
                      <option value="calibration_due">Calibration Due</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Serial Number</label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Calibration Interval (days)</label>
                    <input
                      type="number"
                      value={formData.calibrationInterval || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          calibrationInterval: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Maintenance Interval (days)</label>
                    <input
                      type="number"
                      value={formData.maintenanceInterval || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maintenanceInterval: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Responsible Person</label>
                    <select
                      value={formData.responsiblePerson || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          responsiblePerson: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-grid-full">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEquipment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentPage;
