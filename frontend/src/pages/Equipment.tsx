import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  regenerateQRCode,
  getEquipmentMetrics,
  Equipment as EquipmentType,
  EquipmentMetrics,
} from '../services/equipmentService';
import { getUsers } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import '../styles/Equipment.css';

type ViewMode = 'list' | 'view' | 'add' | 'edit';

function EquipmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<EquipmentType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<EquipmentMetrics | null>(null);
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
      const [equipmentData, usersData, metricsData] = await Promise.all([
        getEquipment(),
        getUsers(),
        getEquipmentMetrics(30),
      ]);
      setEquipment(equipmentData);
      setUsers(usersData);
      setMetrics(metricsData);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || t('messages.loadError');
      setError(errorMsg);
      toast.error(errorMsg);
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
      const errorMsg = err.response?.data?.error || 'Misslyckades att ladda utrustningsdetaljer';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleAddClick = () => {
    navigate('/utrustning/lagg-till');
  };

  const handleEditClick = (id: number) => {
    navigate(`/utrustning/redigera/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    try {
      await deleteEquipment(id);
      toast.showDeleteSuccess(t('equipment.title'));
      await loadData();
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Misslyckades att ta bort utrustning';
      setError(errorMsg);
      toast.error(errorMsg);
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
        toast.showUpdateSuccess(t('equipment.title'));
      } else {
        await createEquipment(formData as any);
        toast.showCreateSuccess(t('equipment.title'));
      }
      handleCloseModal();
      await loadData();
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Misslyckades att spara utrustning';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEquipment(null);
  };

  const handleRegenerateQR = async (id: number) => {
    if (!window.confirm(t('messages.confirmAction'))) {
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
      toast.success(t('messages.updateSuccess'));
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Misslyckades att regenerera QR-kod';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    // Parse date in local timezone to avoid timezone offset issues
    const dateStr = dateString.split('T')[0]; // Get just the date part (yyyy-MM-dd)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'operational': 'equipment.operational',
      'maintenance': 'equipment.maintenance',
      'out_of_service': 'equipment.outOfService',
      'calibration_due': 'equipment.calibrationDue'
    };
    const key = statusMap[status];
    return key ? t(key) : status;
  };

  const getUniqueValues = (field: keyof EquipmentType) => {
    const values = equipment
      .map((e) => e[field])
      .filter((value, index, self) => value && self.indexOf(value) === index);
    return values as string[];
  };

  const getDueDateStatus = (dateString?: string) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', label: t('common.overdue'), class: 'overdue' };
    } else if (diffDays <= 7) {
      return { status: 'critical', label: t('common.dueSoon'), class: 'due-soon' };
    } else if (diffDays <= 30) {
      return { status: 'warning', label: t('common.upcoming'), class: 'upcoming' };
    }
    return null;
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
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
                {t('common.backToList')}
              </button>
              <button className="btn-edit" onClick={() => handleEditClick(selectedEquipment.id!)}>
                {t('common.edit')}
              </button>
            </div>
          </div>

          <div className="detail-body">
            {/* Status Alert */}
            {selectedEquipment.status === 'calibration_due' && (
              <div className="alert-banner alert-warning">
                ⚠ {t('equipment.calibrationDueAlert')}
              </div>
            )}
            {selectedEquipment.status === 'out_of_service' && (
              <div className="alert-banner alert-danger">
                ⛔ {t('equipment.outOfServiceAlert')}
              </div>
            )}

            {/* Basic Information */}
            <div className="detail-section">
              <h3>{t('common.basicInfo')}</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.equipmentNumber')}</span>
                  <span className="detail-value">{selectedEquipment.equipmentNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.name')}</span>
                  <span className="detail-value">{selectedEquipment.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.status')}</span>
                  <span className={`status-badge status-${selectedEquipment.status}`}>
                    {getStatusLabel(selectedEquipment.status)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.location')}</span>
                  <span className="detail-value">{selectedEquipment.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.department')}</span>
                  <span className="detail-value">{selectedEquipment.department || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.purchaseDate')}</span>
                  <span className="detail-value">{formatDate(selectedEquipment.purchaseDate)}</span>
                </div>
              </div>
              {selectedEquipment.description && (
                <div className="detail-item" style={{ marginTop: '1rem' }}>
                  <span className="detail-label">{t('equipment.description')}</span>
                  <span className="detail-value">{selectedEquipment.description}</span>
                </div>
              )}
            </div>

            {/* Manufacturer Information */}
            <div className="detail-section">
              <h3>{t('equipment.manufacturerInfo')}</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.manufacturer')}</span>
                  <span className="detail-value">{selectedEquipment.manufacturer || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.model')}</span>
                  <span className="detail-value">{selectedEquipment.model || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.serialNumber')}</span>
                  <span className="detail-value">{selectedEquipment.serialNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Calibration Information */}
            <div className="detail-section">
              <h3>{t('equipment.calibrationManagement')}</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.lastCalibration')}</span>
                  <span className="detail-value">{formatDate(selectedEquipment.lastCalibrationDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.nextCalibration')}</span>
                  <span className="detail-value">{formatDate(selectedEquipment.nextCalibrationDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.calibrationInterval')}</span>
                  <span className="detail-value">
                    {selectedEquipment.calibrationInterval ? `${selectedEquipment.calibrationInterval} ${t('common.days')}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Information */}
            <div className="detail-section">
              <h3>{t('equipment.maintenanceManagement')}</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.lastMaintenance')}</span>
                  <span className="detail-value">{formatDate(selectedEquipment.lastMaintenanceDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.nextMaintenance')}</span>
                  <span className="detail-value">{formatDate(selectedEquipment.nextMaintenanceDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('equipment.maintenanceInterval')}</span>
                  <span className="detail-value">
                    {selectedEquipment.maintenanceInterval ? `${selectedEquipment.maintenanceInterval} ${t('common.days')}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="detail-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{t('equipment.qrCode')}</h3>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleRegenerateQR(selectedEquipment.id!)}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  {t('equipment.regenerateQR')}
                </button>
              </div>
              {selectedEquipment.qrCode ? (
                <div className="qr-code-container">
                  <img src={selectedEquipment.qrCode} alt={t('equipment.qrCodeAlt')} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    {t('equipment.qrCodeDescription')}
                  </p>
                </div>
              ) : (
                <div className="alert-banner alert-warning">
                  {t('equipment.noQRCode')}
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="detail-section">
              <h3>{t('common.auditTrail')}</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">{t('common.createdAt')}</span>
                  <span className="detail-value">{formatDate(selectedEquipment.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('common.updatedAt')}</span>
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
          <h1>{t('equipment.title')}</h1>
          <p className="subtitle">{t('equipment.management')}</p>
        </div>
        <button className="btn-primary" onClick={handleAddClick}>
          {t('equipment.createEquipment')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Metrics Overview */}
      {metrics && (
        <div className="equipment-metrics">
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>{t('common.total')} {t('equipment.title')}</h3>
              <div className="metric-value">{metrics.total}</div>
            </div>
            <div className="metric-card overdue">
              <h3>{t('equipment.calibrationDue')}</h3>
              <div className="metric-value">{metrics.overdue.calibration}</div>
            </div>
            <div className="metric-card overdue">
              <h3>{t('equipment.maintenanceDue')}</h3>
              <div className="metric-value">{metrics.overdue.maintenance}</div>
            </div>
            <div className="metric-card warning">
              <h3>{t('common.upcoming')}</h3>
              <div className="metric-value">{metrics.upcoming.total}</div>
              <div className="metric-breakdown">
                Kal: {metrics.upcoming.calibration} | Underh: {metrics.upcoming.maintenance}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('common.search') + '...'}
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
            <option value="">{t('common.all')} {t('common.status')}</option>
            <option value="operational">{t('equipment.operational')}</option>
            <option value="maintenance">{t('equipment.maintenance')}</option>
            <option value="out_of_service">{t('equipment.outOfService')}</option>
            <option value="calibration_due">{t('equipment.calibrationDue')}</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="filter-select"
          >
            <option value="">{t('common.all')} {t('departments.title')}</option>
            {getUniqueValues('department').map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={t('common.filter') + ' ' + t('equipment.location') + '...'}
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
                {t('equipment.equipmentNumber')} {sortField === 'equipmentNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                {t('common.name')} {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('location')} style={{ cursor: 'pointer' }}>
                {t('equipment.location')} {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                {t('equipment.department')} {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                {t('common.status')} {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('nextCalibrationDate')} style={{ cursor: 'pointer' }}>
                {t('equipment.nextCalibration')} {sortField === 'nextCalibrationDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('nextMaintenanceDate')} style={{ cursor: 'pointer' }}>
                {t('equipment.nextMaintenance')} {sortField === 'nextMaintenanceDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  {searchTerm || filters.status || filters.department || filters.location
                    ? t('messages.noResults')
                    : t('messages.noData')}
                </td>
              </tr>
            ) : (
              filteredEquipment.map((item) => {
                const calibrationStatus = getDueDateStatus(item.nextCalibrationDate);
                const maintenanceStatus = getDueDateStatus(item.nextMaintenanceDate);
                
                return (
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
                    <td>
                      <div className="due-date-cell">
                        <span>{formatDate(item.nextCalibrationDate)}</span>
                        {calibrationStatus && (
                          <span className={`due-badge ${calibrationStatus.class}`}>
                            {calibrationStatus.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="due-date-cell">
                        <span>{formatDate(item.nextMaintenanceDate)}</span>
                        {maintenanceStatus && (
                          <span className={`due-badge ${maintenanceStatus.class}`}>
                            {maintenanceStatus.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button className="btn-view" onClick={() => handleView(item.id!)}>
                        {t('common.view')}
                      </button>
                      <button className="btn-edit" onClick={() => handleEditClick(item.id!)}>
                        {t('common.edit')}
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id!)}>
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                );
              })
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
