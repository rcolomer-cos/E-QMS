import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getImprovementIdeaById,
  updateImprovementIdea,
  updateImprovementIdeaStatus,
  deleteImprovementIdea,
  getStatusColor,
  getStatusDisplayName,
} from '../services/improvementIdeaService';
import { ImprovementIdea } from '../types';
import { useAuth } from '../services/authService';
import '../styles/ImprovementIdeaDetail.css';

function ImprovementIdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState<ImprovementIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    expectedImpact: '',
    impactArea: '',
    estimatedCost: '',
    estimatedBenefit: '',
    implementationNotes: '',
  });

  const [statusFormData, setStatusFormData] = useState({
    status: '' as ImprovementIdea['status'],
    reviewComments: '',
  });

  useEffect(() => {
    loadIdea();
  }, [id]);

  const loadIdea = async () => {
    try {
      setLoading(true);
      const data = await getImprovementIdeaById(parseInt(id!, 10));
      setIdea(data);
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        expectedImpact: data.expectedImpact || '',
        impactArea: data.impactArea || '',
        estimatedCost: data.estimatedCost?.toString() || '',
        estimatedBenefit: data.estimatedBenefit || '',
        implementationNotes: data.implementationNotes || '',
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load improvement idea');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateImprovementIdea(parseInt(id!, 10), {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        expectedImpact: formData.expectedImpact || undefined,
        impactArea: formData.impactArea || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        estimatedBenefit: formData.estimatedBenefit || undefined,
        implementationNotes: formData.implementationNotes || undefined,
      });
      setIsEditing(false);
      loadIdea();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update improvement idea');
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateImprovementIdeaStatus(
        parseInt(id!, 10),
        statusFormData.status,
        statusFormData.reviewComments || undefined
      );
      setShowStatusModal(false);
      loadIdea();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this improvement idea?')) {
      return;
    }
    try {
      await deleteImprovementIdea(parseInt(id!, 10));
      navigate('/improvement-ideas');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete improvement idea');
    }
  };

  const canEdit = user && idea && (
    user.id === idea.submittedBy ||
    user.role === 'admin' ||
    user.role === 'manager'
  );

  const canChangeStatus = user && (
    user.role === 'admin' ||
    user.role === 'manager'
  );

  if (loading) {
    return <div className="loading">Loading improvement idea...</div>;
  }

  if (!idea) {
    return <div className="error-message">Improvement idea not found</div>;
  }

  return (
    <div className="improvement-idea-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/improvement-ideas')} className="btn-back">
            ← Back to Ideas
          </button>
          <h1>{idea.ideaNumber}</h1>
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(idea.status) }}
          >
            {getStatusDisplayName(idea.status)}
          </span>
        </div>
        <div className="header-actions">
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-edit">
              Edit
            </button>
          )}
          {canChangeStatus && (
            <button onClick={() => setShowStatusModal(true)} className="btn-status">
              Update Status
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={handleDelete} className="btn-delete">
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isEditing ? (
        <form onSubmit={handleUpdate} className="edit-form">
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
              rows={6}
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
              rows={4}
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
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="implementationNotes">Implementation Notes</label>
            <textarea
              id="implementationNotes"
              value={formData.implementationNotes}
              onChange={(e) => setFormData({ ...formData, implementationNotes: e.target.value })}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => { setIsEditing(false); loadIdea(); }} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="detail-content">
          <div className="detail-section">
            <h2>Idea Information</h2>
            <div className="detail-grid">
              <div className="detail-field">
                <label>Title:</label>
                <div>{idea.title}</div>
              </div>
              <div className="detail-field">
                <label>Category:</label>
                <div>{idea.category}</div>
              </div>
              <div className="detail-field">
                <label>Impact Area:</label>
                <div>{idea.impactArea || 'Not specified'}</div>
              </div>
              <div className="detail-field">
                <label>Submitted By:</label>
                <div>{idea.submitterFirstName} {idea.submitterLastName}</div>
              </div>
              <div className="detail-field">
                <label>Submitted Date:</label>
                <div>{new Date(idea.submittedDate).toLocaleDateString()}</div>
              </div>
              {idea.responsibleFirstName && (
                <div className="detail-field">
                  <label>Responsible User:</label>
                  <div>{idea.responsibleFirstName} {idea.responsibleLastName}</div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Description</h3>
            <p className="detail-description">{idea.description}</p>
          </div>

          {idea.expectedImpact && (
            <div className="detail-section">
              <h3>Expected Impact</h3>
              <p className="detail-description">{idea.expectedImpact}</p>
            </div>
          )}

          {(idea.estimatedCost !== null && idea.estimatedCost !== undefined) && (
            <div className="detail-section">
              <h3>Financial Information</h3>
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Estimated Cost:</label>
                  <div>${idea.estimatedCost.toLocaleString()}</div>
                </div>
                {idea.estimatedBenefit && (
                  <div className="detail-field">
                    <label>Estimated Benefit:</label>
                    <div>{idea.estimatedBenefit}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {idea.reviewComments && (
            <div className="detail-section">
              <h3>Review Comments</h3>
              <p className="detail-description">{idea.reviewComments}</p>
              {idea.reviewerFirstName && (
                <p className="reviewer-info">
                  Reviewed by: {idea.reviewerFirstName} {idea.reviewerLastName}
                  {idea.reviewedDate && ` on ${new Date(idea.reviewedDate).toLocaleDateString()}`}
                </p>
              )}
            </div>
          )}

          {idea.implementationNotes && (
            <div className="detail-section">
              <h3>Implementation Notes</h3>
              <p className="detail-description">{idea.implementationNotes}</p>
            </div>
          )}

          {idea.implementedDate && (
            <div className="detail-section">
              <h3>Implementation</h3>
              <div className="detail-field">
                <label>Implemented Date:</label>
                <div>{new Date(idea.implementedDate).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Status</h2>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as ImprovementIdea['status'] })}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="in_progress">In Progress</option>
                  <option value="implemented">Implemented</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reviewComments">Review Comments</label>
                <textarea
                  id="reviewComments"
                  value={statusFormData.reviewComments}
                  onChange={(e) => setStatusFormData({ ...statusFormData, reviewComments: e.target.value })}
                  maxLength={2000}
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImprovementIdeaDetail;
