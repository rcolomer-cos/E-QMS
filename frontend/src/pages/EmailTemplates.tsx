import { useState, useEffect } from 'react';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  EmailTemplate,
  CreateEmailTemplateData,
} from '../services/emailTemplateService';
import '../styles/EmailTemplates.css';

const TEMPLATE_TYPES = [
  { value: 'ncr_notification', label: 'NCR Notification' },
  { value: 'ncr_assignment', label: 'NCR Assignment' },
  { value: 'ncr_status_update', label: 'NCR Status Update' },
  { value: 'training_reminder', label: 'Training Reminder' },
  { value: 'training_assignment', label: 'Training Assignment' },
  { value: 'training_expiry_warning', label: 'Training Expiry Warning' },
  { value: 'audit_assignment', label: 'Audit Assignment' },
  { value: 'audit_notification', label: 'Audit Notification' },
  { value: 'audit_finding', label: 'Audit Finding' },
  { value: 'capa_assignment', label: 'CAPA Assignment' },
  { value: 'capa_deadline_reminder', label: 'CAPA Deadline Reminder' },
];

const TEMPLATE_CATEGORIES = [
  { value: 'ncr', label: 'NCR' },
  { value: 'training', label: 'Training' },
  { value: 'audit', label: 'Audit' },
  { value: 'capa', label: 'CAPA' },
  { value: 'general', label: 'General' },
];

function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const [formData, setFormData] = useState<CreateEmailTemplateData>({
    name: '',
    displayName: '',
    type: 'ncr_notification',
    category: 'ncr',
    subject: '',
    body: '',
    description: '',
    placeholders: '',
    isActive: true,
    isDefault: false,
  });

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const filters: any = {};
      if (filterCategory) filters.category = filterCategory;
      if (filterType) filters.type = filterType;

      const data = await getEmailTemplates(filters);
      setTemplates(data);
    } catch (err: any) {
      console.error('Error loading email templates:', err);
      setError(err.response?.data?.error || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [filterCategory, filterType]);

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        displayName: template.displayName,
        type: template.type,
        category: template.category,
        subject: template.subject,
        body: template.body,
        description: template.description || '',
        placeholders: template.placeholders || '',
        isActive: template.isActive,
        isDefault: template.isDefault,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        displayName: '',
        type: 'ncr_notification',
        category: 'ncr',
        subject: '',
        body: '',
        description: '',
        placeholders: '',
        isActive: true,
        isDefault: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id!, formData);
      } else {
        await createEmailTemplate(formData);
      }
      handleCloseModal();
      loadTemplates();
    } catch (err: any) {
      console.error('Error saving email template:', err);
      setError(err.response?.data?.error || 'Failed to save email template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this email template?')) {
      return;
    }

    try {
      await deleteEmailTemplate(id);
      loadTemplates();
    } catch (err: any) {
      console.error('Error deleting email template:', err);
      setError(err.response?.data?.error || 'Failed to delete email template');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const cursorPos = (document.getElementById('template-body') as HTMLTextAreaElement)?.selectionStart || formData.body.length;
    const beforeCursor = formData.body.substring(0, cursorPos);
    const afterCursor = formData.body.substring(cursorPos);
    const newBody = beforeCursor + `{{${placeholder}}}` + afterCursor;
    setFormData((prev) => ({ ...prev, body: newBody }));
  };

  const getPlaceholdersList = (placeholdersStr: string): string[] => {
    try {
      return placeholdersStr ? JSON.parse(placeholdersStr) : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Email Templates</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          Create Template
        </button>
      </div>

      {error && !showModal && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div>
          <label htmlFor="filterCategory">Category: </label>
          <select
            id="filterCategory"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterType">Type: </label>
          <select id="filterType" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {TEMPLATE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="templates-grid">
          {templates.length === 0 ? (
            <div>No email templates found</div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.displayName}</h3>
                  <div className="template-badges">
                    {template.isDefault && <span className="badge badge-default">Default</span>}
                    {!template.isActive && <span className="badge badge-inactive">Inactive</span>}
                  </div>
                </div>
                <div className="template-details">
                  <p>
                    <strong>Type:</strong>{' '}
                    {TEMPLATE_TYPES.find((t) => t.value === template.type)?.label || template.type}
                  </p>
                  <p>
                    <strong>Category:</strong>{' '}
                    {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label ||
                      template.category}
                  </p>
                  <p>
                    <strong>Subject:</strong> {template.subject}
                  </p>
                  {template.description && (
                    <p>
                      <strong>Description:</strong> {template.description}
                    </p>
                  )}
                </div>
                <div className="template-actions">
                  <button className="btn-secondary" onClick={() => handleOpenModal(template)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(template.id!)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTemplate ? 'Edit Email Template' : 'Create Email Template'}</h2>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            {error && (
              <div className="error-message" style={{ marginBottom: '15px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name (Internal)*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="displayName">Display Name*</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Type*</label>
                  <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
                    {TEMPLATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category*</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject*</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Use {{placeholder}} for dynamic content"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Describe when to use this template"
                />
              </div>

              <div className="form-group">
                <label htmlFor="template-body">Body*</label>
                <textarea
                  id="template-body"
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  rows={12}
                  required
                  placeholder="Email body content. Use {{placeholder}} for dynamic content."
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  Use double curly braces for placeholders, e.g., {'{{'}recipientName{'}}'}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="placeholders">Available Placeholders (JSON array)</label>
                <textarea
                  id="placeholders"
                  name="placeholders"
                  value={formData.placeholders}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder='["recipientName", "ncrNumber", "title"]'
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  Enter placeholders as a JSON array. Click a placeholder below to insert it.
                </small>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {getPlaceholdersList(formData.placeholders || '').map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      className="btn-placeholder"
                      onClick={() => insertPlaceholder(placeholder)}
                    >
                      {'{{'}
                      {placeholder}
                      {'}}'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                    />
                    Set as Default Template
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailTemplates;
