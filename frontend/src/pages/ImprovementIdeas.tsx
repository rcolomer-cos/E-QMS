import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getImprovementIdeas,
  getImprovementIdeaStatistics,
  createImprovementIdea,
  ImprovementIdeaFilters,
  getStatusColor,
  getStatusDisplayName,
} from '../services/improvementIdeaService';
import { ImprovementIdea, ImprovementIdeaStatistics } from '../types';
import '../styles/ImprovementIdeas.css';

type ViewMode = 'board' | 'list';

function ImprovementIdeas() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<ImprovementIdea[]>([]);
  const [statistics, setStatistics] = useState<ImprovementIdeaStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<ImprovementIdeaFilters>({
    limit: 100,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    expectedImpact: '',
    impactArea: '',
    estimatedCost: '',
    estimatedBenefit: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ideasData, statsData] = await Promise.all([
        getImprovementIdeas(filters),
        getImprovementIdeaStatistics(),
      ]);
      setIdeas(ideasData.data);
      setStatistics(statsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load improvement ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ImprovementIdeaFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleIdeaClick = (ideaId: number) => {
    navigate(`/improvement-ideas/${ideaId}`);
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createImprovementIdea({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        expectedImpact: formData.expectedImpact || undefined,
        impactArea: formData.impactArea || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        estimatedBenefit: formData.estimatedBenefit || undefined,
      });
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        expectedImpact: '',
        impactArea: '',
        estimatedCost: '',
        estimatedBenefit: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create improvement idea');
    }
  };

  const getIdeasByStatus = (status: ImprovementIdea['status']): ImprovementIdea[] => {
    return ideas.filter(idea => idea.status === status);
  };

  const filteredIdeas = ideas.filter(idea => {
    if (filters.status && idea.status !== filters.status) return false;
    if (filters.category && idea.category !== filters.category) return false;
    if (filters.impactArea && idea.impactArea !== filters.impactArea) return false;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading improvement ideas...</div>;
  }

  return (
    <div className="improvement-ideas-container">
      <div className="improvement-ideas-header">
        <div className="header-left">
          <h1>Improvement Ideas</h1>
          <button onClick={() => setShowCreateModal(true)} className="btn-create">
            + Submit Idea
          </button>
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'board' ? 'active' : ''}
            onClick={() => setViewMode('board')}
          >
            Board View
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Summary */}
      {statistics && (
        <div className="ideas-stats">
          <div className="stat-item">
            <span className="stat-label">Total Ideas:</span>
            <span className="stat-value">{statistics.totalIdeas}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Submitted:</span>
            <span className="stat-value" style={{ color: getStatusColor('submitted') }}>
              {statistics.submitted}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Under Review:</span>
            <span className="stat-value" style={{ color: getStatusColor('under_review') }}>
              {statistics.underReview}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Approved:</span>
            <span className="stat-value" style={{ color: getStatusColor('approved') }}>
              {statistics.approved}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Implemented:</span>
            <span className="stat-value" style={{ color: getStatusColor('implemented') }}>
              {statistics.implemented}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ideas-filters">
        <select
          value={filters.category || ''}
          onChange={e => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {statistics && Object.keys(statistics.byCategory).map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={filters.impactArea || ''}
          onChange={e => handleFilterChange('impactArea', e.target.value)}
        >
          <option value="">All Impact Areas</option>
          {statistics && Object.keys(statistics.byImpactArea).map(area => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <button onClick={() => setFilters({ limit: 100 })} className="btn-clear-filters">
          Clear Filters
        </button>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="ideas-board">
          <div className="board-column">
            <div className="column-header" style={{ borderTopColor: getStatusColor('submitted') }}>
              <h3>Submitted</h3>
              <span className="count">{getIdeasByStatus('submitted').length}</span>
            </div>
            <div className="column-content">
              {getIdeasByStatus('submitted').map(idea => (
                <div key={idea.id} className="idea-card" onClick={() => handleIdeaClick(idea.id!)}>
                  <div className="idea-card-number">{idea.ideaNumber}</div>
                  <h4 className="idea-card-title">{idea.title}</h4>
                  <div className="idea-card-meta">
                    <span className="category">{idea.category}</span>
                    {idea.impactArea && <span className="impact-area">{idea.impactArea}</span>}
                  </div>
                  <div className="idea-card-submitter">
                    By: {idea.submitterFirstName} {idea.submitterLastName}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="board-column">
            <div className="column-header" style={{ borderTopColor: getStatusColor('under_review') }}>
              <h3>Under Review</h3>
              <span className="count">{getIdeasByStatus('under_review').length}</span>
            </div>
            <div className="column-content">
              {getIdeasByStatus('under_review').map(idea => (
                <div key={idea.id} className="idea-card" onClick={() => handleIdeaClick(idea.id!)}>
                  <div className="idea-card-number">{idea.ideaNumber}</div>
                  <h4 className="idea-card-title">{idea.title}</h4>
                  <div className="idea-card-meta">
                    <span className="category">{idea.category}</span>
                    {idea.impactArea && <span className="impact-area">{idea.impactArea}</span>}
                  </div>
                  {idea.responsibleFirstName && (
                    <div className="idea-card-responsible">
                      Assigned: {idea.responsibleFirstName} {idea.responsibleLastName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="board-column">
            <div className="column-header" style={{ borderTopColor: getStatusColor('approved') }}>
              <h3>Approved</h3>
              <span className="count">{getIdeasByStatus('approved').length}</span>
            </div>
            <div className="column-content">
              {getIdeasByStatus('approved').map(idea => (
                <div key={idea.id} className="idea-card" onClick={() => handleIdeaClick(idea.id!)}>
                  <div className="idea-card-number">{idea.ideaNumber}</div>
                  <h4 className="idea-card-title">{idea.title}</h4>
                  <div className="idea-card-meta">
                    <span className="category">{idea.category}</span>
                    {idea.impactArea && <span className="impact-area">{idea.impactArea}</span>}
                  </div>
                  {idea.responsibleFirstName && (
                    <div className="idea-card-responsible">
                      Assigned: {idea.responsibleFirstName} {idea.responsibleLastName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="board-column">
            <div className="column-header" style={{ borderTopColor: getStatusColor('in_progress') }}>
              <h3>In Progress</h3>
              <span className="count">{getIdeasByStatus('in_progress').length}</span>
            </div>
            <div className="column-content">
              {getIdeasByStatus('in_progress').map(idea => (
                <div key={idea.id} className="idea-card" onClick={() => handleIdeaClick(idea.id!)}>
                  <div className="idea-card-number">{idea.ideaNumber}</div>
                  <h4 className="idea-card-title">{idea.title}</h4>
                  <div className="idea-card-meta">
                    <span className="category">{idea.category}</span>
                    {idea.impactArea && <span className="impact-area">{idea.impactArea}</span>}
                  </div>
                  {idea.responsibleFirstName && (
                    <div className="idea-card-responsible">
                      Assigned: {idea.responsibleFirstName} {idea.responsibleLastName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="board-column">
            <div className="column-header" style={{ borderTopColor: getStatusColor('implemented') }}>
              <h3>Implemented</h3>
              <span className="count">{getIdeasByStatus('implemented').length}</span>
            </div>
            <div className="column-content">
              {getIdeasByStatus('implemented').map(idea => (
                <div key={idea.id} className="idea-card" onClick={() => handleIdeaClick(idea.id!)}>
                  <div className="idea-card-number">{idea.ideaNumber}</div>
                  <h4 className="idea-card-title">{idea.title}</h4>
                  <div className="idea-card-meta">
                    <span className="category">{idea.category}</span>
                    {idea.impactArea && <span className="impact-area">{idea.impactArea}</span>}
                  </div>
                  <div className="idea-card-date">
                    {idea.implementedDate && new Date(idea.implementedDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="ideas-list">
          <table className="ideas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Impact Area</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Submitted Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map(idea => (
                <tr key={idea.id} onClick={() => handleIdeaClick(idea.id!)} className="clickable-row">
                  <td>{idea.ideaNumber}</td>
                  <td>{idea.title}</td>
                  <td>{idea.category}</td>
                  <td>{idea.impactArea || '-'}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(idea.status) }}
                    >
                      {getStatusDisplayName(idea.status)}
                    </span>
                  </td>
                  <td>{idea.submitterFirstName} {idea.submitterLastName}</td>
                  <td>{new Date(idea.submittedDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Improvement Idea</h2>
            <form onSubmit={handleCreateIdea}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={2000}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Process Improvement">Process Improvement</option>
                  <option value="Cost Reduction">Cost Reduction</option>
                  <option value="Quality Enhancement">Quality Enhancement</option>
                  <option value="Safety">Safety</option>
                  <option value="Customer Satisfaction">Customer Satisfaction</option>
                  <option value="Efficiency">Efficiency</option>
                  <option value="Innovation">Innovation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="expectedImpact">Expected Impact</label>
                <textarea
                  id="expectedImpact"
                  value={formData.expectedImpact}
                  onChange={(e) => setFormData({ ...formData, expectedImpact: e.target.value })}
                  maxLength={2000}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="impactArea">Impact Area</label>
                <select
                  id="impactArea"
                  value={formData.impactArea}
                  onChange={(e) => setFormData({ ...formData, impactArea: e.target.value })}
                >
                  <option value="">Select Impact Area</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Quality">Quality</option>
                  <option value="Cost">Cost</option>
                  <option value="Safety">Safety</option>
                  <option value="Customer Satisfaction">Customer Satisfaction</option>
                  <option value="Employee Satisfaction">Employee Satisfaction</option>
                  <option value="Environmental">Environmental</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="estimatedCost">Estimated Cost ($)</label>
                <input
                  type="number"
                  id="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="estimatedBenefit">Estimated Benefit</label>
                <textarea
                  id="estimatedBenefit"
                  value={formData.estimatedBenefit}
                  onChange={(e) => setFormData({ ...formData, estimatedBenefit: e.target.value })}
                  maxLength={1000}
                  rows={2}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImprovementIdeas;
