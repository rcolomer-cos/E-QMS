import { useState, useEffect } from 'react';
import {
  getSwotEntries,
  getSwotStatistics,
  createSwotEntry,
  updateSwotEntry,
  deleteSwotEntry,
  CreateSwotEntryData,
  SwotEntry,
  SwotStatistics,
  SwotFilters,
  getPriorityColor,
  getCategoryColor,
} from '../services/swotService';
import { getUsers } from '../services/userService';
import { User } from '../types';
import '../styles/SwotAnalysis.css';

function SwotAnalysis() {
  const [entries, setEntries] = useState<SwotEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<SwotStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SwotEntry | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<SwotFilters>({
    status: 'active',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateSwotEntryData>({
    title: '',
    description: '',
    category: 'Strength',
    owner: undefined,
    priority: 'medium',
    reviewDate: undefined,
    nextReviewDate: undefined,
    status: 'active',
  });

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, usersData, statsData] = await Promise.all([
        getSwotEntries(filters),
        getUsers(),
        getSwotStatistics(),
      ]);
      setEntries(entriesData.data);
      setUsers(usersData);
      setStatistics(statsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to parse user from localStorage:', err);
      }
    }
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'superuser' || false;
  };

  const canModify = (): boolean => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'manager' || 
           currentUser?.role === 'superuser' || false;
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await updateSwotEntry(editingEntry.id!, formData);
      } else {
        await createSwotEntry(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save SWOT entry');
    }
  };

  const handleEdit = (entry: SwotEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      description: entry.description || '',
      category: entry.category,
      owner: entry.owner,
      priority: entry.priority,
      reviewDate: entry.reviewDate?.split('T')[0],
      nextReviewDate: entry.nextReviewDate?.split('T')[0],
      status: entry.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this SWOT entry?')) {
      return;
    }
    try {
      await deleteSwotEntry(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete SWOT entry');
    }
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      title: '',
      description: '',
      category: 'Strength',
      owner: undefined,
      priority: 'medium',
      reviewDate: undefined,
      nextReviewDate: undefined,
      status: 'active',
    });
  };

  const openModal = (category?: 'Strength' | 'Weakness' | 'Opportunity' | 'Threat') => {
    resetForm();
    if (category) {
      setFormData(prev => ({ ...prev, category }));
    }
    setShowModal(true);
  };

  const getEntriesByCategory = (category: string): SwotEntry[] => {
    return entries
      .filter(entry => entry.category === category)
      .filter(entry => 
        searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const getUserName = (userId?: number): string => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  if (loading) {
    return <div className="loading">Loading SWOT Analysis...</div>;
  }

  return (
    <div className="swot-container">
      <div className="swot-header">
        <div>
          <h1>SWOT Analysis</h1>
          <p>Strategic planning and management review</p>
        </div>
        {canModify() && (
          <button className="btn-primary" onClick={() => openModal()}>
            Add SWOT Entry
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="swot-filters">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entries..."
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="addressed">Addressed</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority || ''}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="swot-stats">
          <div className="stat-card">
            <h3>{statistics.totalEntries}</h3>
            <p>Total Entries</p>
          </div>
          <div className="stat-card">
            <h3>{statistics.byCategory.Strength || 0}</h3>
            <p>Strengths</p>
          </div>
          <div className="stat-card">
            <h3>{statistics.byCategory.Weakness || 0}</h3>
            <p>Weaknesses</p>
          </div>
          <div className="stat-card">
            <h3>{statistics.byCategory.Opportunity || 0}</h3>
            <p>Opportunities</p>
          </div>
          <div className="stat-card">
            <h3>{statistics.byCategory.Threat || 0}</h3>
            <p>Threats</p>
          </div>
        </div>
      )}

      {/* SWOT Matrix */}
      <div className="swot-matrix">
        {/* Strengths Quadrant */}
        <div className="swot-quadrant strengths">
          <div className="quadrant-header" style={{ backgroundColor: getCategoryColor('Strength') }}>
            <h2>Strengths</h2>
            {canModify() && (
              <button className="btn-add" onClick={() => openModal('Strength')}>+</button>
            )}
          </div>
          <div className="quadrant-content">
            {getEntriesByCategory('Strength').length === 0 ? (
              <p className="empty-message">No strengths identified</p>
            ) : (
              getEntriesByCategory('Strength').map(entry => (
                <div key={entry.id} className="swot-entry">
                  <div className="entry-header">
                    <h4>{entry.title}</h4>
                    {entry.priority && (
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(entry.priority) }}
                      >
                        {entry.priority}
                      </span>
                    )}
                  </div>
                  {entry.description && <p>{entry.description}</p>}
                  <div className="entry-meta">
                    <span>Owner: {getUserName(entry.owner)}</span>
                    {canModify() && (
                      <div className="entry-actions">
                        <button onClick={() => handleEdit(entry)}>Edit</button>
                        {isAdmin() && (
                          <button onClick={() => handleDelete(entry.id!)}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weaknesses Quadrant */}
        <div className="swot-quadrant weaknesses">
          <div className="quadrant-header" style={{ backgroundColor: getCategoryColor('Weakness') }}>
            <h2>Weaknesses</h2>
            {canModify() && (
              <button className="btn-add" onClick={() => openModal('Weakness')}>+</button>
            )}
          </div>
          <div className="quadrant-content">
            {getEntriesByCategory('Weakness').length === 0 ? (
              <p className="empty-message">No weaknesses identified</p>
            ) : (
              getEntriesByCategory('Weakness').map(entry => (
                <div key={entry.id} className="swot-entry">
                  <div className="entry-header">
                    <h4>{entry.title}</h4>
                    {entry.priority && (
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(entry.priority) }}
                      >
                        {entry.priority}
                      </span>
                    )}
                  </div>
                  {entry.description && <p>{entry.description}</p>}
                  <div className="entry-meta">
                    <span>Owner: {getUserName(entry.owner)}</span>
                    {canModify() && (
                      <div className="entry-actions">
                        <button onClick={() => handleEdit(entry)}>Edit</button>
                        {isAdmin() && (
                          <button onClick={() => handleDelete(entry.id!)}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Opportunities Quadrant */}
        <div className="swot-quadrant opportunities">
          <div className="quadrant-header" style={{ backgroundColor: getCategoryColor('Opportunity') }}>
            <h2>Opportunities</h2>
            {canModify() && (
              <button className="btn-add" onClick={() => openModal('Opportunity')}>+</button>
            )}
          </div>
          <div className="quadrant-content">
            {getEntriesByCategory('Opportunity').length === 0 ? (
              <p className="empty-message">No opportunities identified</p>
            ) : (
              getEntriesByCategory('Opportunity').map(entry => (
                <div key={entry.id} className="swot-entry">
                  <div className="entry-header">
                    <h4>{entry.title}</h4>
                    {entry.priority && (
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(entry.priority) }}
                      >
                        {entry.priority}
                      </span>
                    )}
                  </div>
                  {entry.description && <p>{entry.description}</p>}
                  <div className="entry-meta">
                    <span>Owner: {getUserName(entry.owner)}</span>
                    {canModify() && (
                      <div className="entry-actions">
                        <button onClick={() => handleEdit(entry)}>Edit</button>
                        {isAdmin() && (
                          <button onClick={() => handleDelete(entry.id!)}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Threats Quadrant */}
        <div className="swot-quadrant threats">
          <div className="quadrant-header" style={{ backgroundColor: getCategoryColor('Threat') }}>
            <h2>Threats</h2>
            {canModify() && (
              <button className="btn-add" onClick={() => openModal('Threat')}>+</button>
            )}
          </div>
          <div className="quadrant-content">
            {getEntriesByCategory('Threat').length === 0 ? (
              <p className="empty-message">No threats identified</p>
            ) : (
              getEntriesByCategory('Threat').map(entry => (
                <div key={entry.id} className="swot-entry">
                  <div className="entry-header">
                    <h4>{entry.title}</h4>
                    {entry.priority && (
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(entry.priority) }}
                      >
                        {entry.priority}
                      </span>
                    )}
                  </div>
                  {entry.description && <p>{entry.description}</p>}
                  <div className="entry-meta">
                    <span>Owner: {getUserName(entry.owner)}</span>
                    {canModify() && (
                      <div className="entry-actions">
                        <button onClick={() => handleEdit(entry)}>Edit</button>
                        {isAdmin() && (
                          <button onClick={() => handleDelete(entry.id!)}>Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEntry ? 'Edit SWOT Entry' : 'Create SWOT Entry'}</h2>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  required
                >
                  <option value="Strength">Strength</option>
                  <option value="Weakness">Weakness</option>
                  <option value="Opportunity">Opportunity</option>
                  <option value="Threat">Threat</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={500}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={2000}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Owner</label>
                  <select
                    value={formData.owner || ''}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value ? parseInt(e.target.value) : undefined })}
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any || undefined })}
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Review Date</label>
                  <input
                    type="date"
                    value={formData.reviewDate || ''}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value || undefined })}
                  />
                </div>
                <div className="form-group">
                  <label>Next Review Date</label>
                  <input
                    type="date"
                    value={formData.nextReviewDate || ''}
                    onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="addressed">Addressed</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEntry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SwotAnalysis;
