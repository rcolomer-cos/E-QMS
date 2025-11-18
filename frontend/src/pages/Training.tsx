import { useState, useEffect } from 'react';
import ExpiringCertificates from '../components/ExpiringCertificates';
import { getTrainings, createTraining, Training } from '../services/trainingService';
import '../styles/Training.css';

function TrainingManagement() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExpiringCertificates, setShowExpiringCertificates] = useState(true);
  const [showExpiringRecords, setShowExpiringRecords] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    trainingNumber: '',
    title: '',
    description: '',
    category: '',
    duration: undefined as number | undefined,
    instructor: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'expired',
    scheduledDate: '',
    completedDate: undefined as string | undefined,
    expiryMonths: undefined as number | undefined,
  });

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page: 1, limit: 100 };
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      
      const response = await getTrainings(params);
      setTrainings(response.data);
    } catch (err: any) {
      console.error('Error loading trainings:', err);
      setError(err.response?.data?.error || 'Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, [filterStatus, filterCategory]);

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        setError('User not authenticated');
        return;
      }

      const trainingData = {
        ...formData,
        createdBy: user.id,
        scheduledDate: new Date(formData.scheduledDate),
      };

      await createTraining(trainingData as any);
      setShowCreateModal(false);
      setFormData({
        trainingNumber: '',
        title: '',
        description: '',
        category: '',
        duration: undefined,
        instructor: '',
        status: 'scheduled',
        scheduledDate: '',
        completedDate: undefined,
        expiryMonths: undefined,
      });
      loadTrainings();
    } catch (err: any) {
      console.error('Error creating training:', err);
      setError(err.response?.data?.error || 'Failed to create training');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name === 'duration' || name === 'expiryMonths' ? parseInt(value, 10) : value)
    }));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'status-badge status-completed';
      case 'scheduled': return 'status-badge status-scheduled';
      case 'cancelled': return 'status-badge status-cancelled';
      case 'expired': return 'status-badge status-expired';
      default: return 'status-badge';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Training Management</h1>
        <button className="tw-btn tw-btn-primary" onClick={() => setShowCreateModal(true)}>
          Schedule Training
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Expiring Certificates Section */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            className={showExpiringCertificates ? 'tw-btn tw-btn-primary' : 'tw-btn tw-btn-secondary'}
            onClick={() => setShowExpiringCertificates(!showExpiringCertificates)}
          >
            {showExpiringCertificates ? 'Hide' : 'Show'} Expiring Certificates
          </button>
          <button
            className={showExpiringRecords ? 'tw-btn tw-btn-primary' : 'tw-btn tw-btn-secondary'}
            onClick={() => setShowExpiringRecords(!showExpiringRecords)}
          >
            {showExpiringRecords ? 'Hide' : 'Show'} Expiring Training Records
          </button>
        </div>

        {showExpiringCertificates && <ExpiringCertificates daysThreshold={90} />}
        {showExpiringRecords && <ExpiringCertificates daysThreshold={90} showAttendeeRecords={true} />}
      </div>

      {/* Filters */}
      <div className="filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div>
          <label htmlFor="filterStatus">Status: </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterCategory">Category: </label>
          <select
            id="filterCategory"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '5px' }}
          >
            <option value="">All</option>
            <option value="Safety">Safety</option>
            <option value="Quality">Quality</option>
            <option value="Technical">Technical</option>
            <option value="Compliance">Compliance</option>
            <option value="Management">Management</option>
          </select>
        </div>
      </div>

      {/* Trainings Table */}
      {loading ? (
        <div>Loading trainings...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Training Number</th>
              <th>Title</th>
              <th>Category</th>
              <th>Instructor</th>
              <th>Status</th>
              <th>Scheduled Date</th>
              <th>Duration (min)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                  No trainings found. Click "Schedule Training" to create one.
                </td>
              </tr>
            ) : (
              trainings.map((training) => (
                <tr key={training.id}>
                  <td>{training.trainingNumber}</td>
                  <td>{training.title}</td>
                  <td>{training.category}</td>
                  <td>{training.instructor || 'N/A'}</td>
                  <td>
                    <span className={getStatusBadgeClass(training.status)}>
                      {training.status}
                    </span>
                  </td>
                  <td>{new Date(training.scheduledDate).toLocaleDateString()}</td>
                  <td>{training.duration || 'N/A'}</td>
                  <td>
                    <button className="tw-btn-small" onClick={() => alert('View details - To be implemented')}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Create Training Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule New Training</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTraining}>
              <div className="form-group">
                <label htmlFor="trainingNumber">Training Number *</label>
                <input
                  type="text"
                  id="trainingNumber"
                  name="trainingNumber"
                  value={formData.trainingNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., TRN-2024-001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Training title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Training description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Safety">Safety</option>
                    <option value="Quality">Quality</option>
                    <option value="Technical">Technical</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="scheduledDate">Scheduled Date *</label>
                  <input
                    type="datetime-local"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration || ''}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="instructor">Instructor</label>
                  <input
                    type="text"
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    placeholder="Instructor name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expiryMonths">Certificate Validity (months)</label>
                  <input
                    type="number"
                    id="expiryMonths"
                    name="expiryMonths"
                    value={formData.expiryMonths || ''}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="tw-btn tw-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="tw-btn tw-btn-primary">
                  Schedule Training
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingManagement;
