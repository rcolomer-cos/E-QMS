import { useState, FormEvent, ChangeEvent } from 'react';
import { CreateCAPAData } from '../services/capaService';
import { User } from '../types';
import '../styles/CAPAForm.css';

interface CAPAFormProps {
  onSubmit: (data: CreateCAPAData) => Promise<void>;
  onCancel: () => void;
  users: User[];
  currentUserId: number;
  ncrId?: number;
  auditId?: number;
}

interface FormErrors {
  capaNumber?: string;
  title?: string;
  description?: string;
  type?: string;
  source?: string;
  priority?: string;
  proposedAction?: string;
  actionOwner?: string;
  targetDate?: string;
}

const CAPAForm = ({ onSubmit, onCancel, users, currentUserId, ncrId, auditId }: CAPAFormProps) => {
  const [formData, setFormData] = useState<CreateCAPAData>({
    capaNumber: '',
    title: '',
    description: '',
    type: 'corrective',
    source: ncrId ? `NCR-${ncrId}` : (auditId ? `Audit-${auditId}` : ''),
    status: 'open',
    priority: 'medium',
    ncrId,
    auditId,
    proposedAction: '',
    actionOwner: currentUserId,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default: 30 days from now
    createdBy: currentUserId,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validate field
  const validateField = (name: keyof CreateCAPAData, value: any): string | undefined => {
    switch (name) {
      case 'capaNumber':
        if (!value || value.trim().length === 0) {
          return 'CAPA Number is required';
        }
        if (value.length > 100) {
          return 'CAPA Number must not exceed 100 characters';
        }
        break;
      case 'title':
        if (!value || value.trim().length === 0) {
          return 'Title is required';
        }
        if (value.length > 500) {
          return 'Title must not exceed 500 characters';
        }
        break;
      case 'description':
        if (!value || value.trim().length === 0) {
          return 'Description is required';
        }
        if (value.length > 2000) {
          return 'Description must not exceed 2000 characters';
        }
        break;
      case 'source':
        if (!value || value.trim().length === 0) {
          return 'Source is required';
        }
        if (value.length > 200) {
          return 'Source must not exceed 200 characters';
        }
        break;
      case 'proposedAction':
        if (!value || value.trim().length === 0) {
          return 'Proposed Action is required';
        }
        if (value.length > 2000) {
          return 'Proposed Action must not exceed 2000 characters';
        }
        break;
      case 'actionOwner':
        if (!value) {
          return 'Action Owner is required';
        }
        break;
      case 'targetDate':
        if (!value) {
          return 'Target Date is required';
        }
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof CreateCAPAData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name as keyof CreateCAPAData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof CreateCAPAData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Failed to submit CAPA:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="capa-form-container">
      <form onSubmit={handleSubmit} className="capa-form">
        <h2>Create New CAPA</h2>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="capaNumber">
              CAPA Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="capaNumber"
              name="capaNumber"
              value={formData.capaNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.capaNumber && touched.capaNumber ? 'error' : ''}
              placeholder="e.g., CAPA-2024-001"
            />
            {errors.capaNumber && touched.capaNumber && (
              <span className="error-message">{errors.capaNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="type">
              Type <span className="required">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.title && touched.title ? 'error' : ''}
            placeholder="Brief title describing the CAPA"
            maxLength={500}
          />
          {errors.title && touched.title && (
            <span className="error-message">{errors.title}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.description && touched.description ? 'error' : ''}
            placeholder="Detailed description of the issue or opportunity..."
            rows={4}
            maxLength={2000}
          />
          <div className="char-count">{formData.description.length} / 2000</div>
          {errors.description && touched.description && (
            <span className="error-message">{errors.description}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="source">
              Source <span className="required">*</span>
            </label>
            <input
              type="text"
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.source && touched.source ? 'error' : ''}
              placeholder="e.g., NCR-2024-001, Audit, Risk Assessment"
              maxLength={200}
            />
            {errors.source && touched.source && (
              <span className="error-message">{errors.source}</span>
            )}
            <small className="field-hint">
              Source of the CAPA (NCR, audit finding, risk assessment, etc.)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="priority">
              Priority <span className="required">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="proposedAction">
            Proposed Action <span className="required">*</span>
          </label>
          <textarea
            id="proposedAction"
            name="proposedAction"
            value={formData.proposedAction}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.proposedAction && touched.proposedAction ? 'error' : ''}
            placeholder="Describe the corrective or preventive action to be taken..."
            rows={4}
            maxLength={2000}
          />
          <div className="char-count">{formData.proposedAction.length} / 2000</div>
          {errors.proposedAction && touched.proposedAction && (
            <span className="error-message">{errors.proposedAction}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="actionOwner">
              Action Owner <span className="required">*</span>
            </label>
            <select
              id="actionOwner"
              name="actionOwner"
              value={formData.actionOwner}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.actionOwner && touched.actionOwner ? 'error' : ''}
            >
              <option value="">Select Action Owner</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.department || 'N/A'})
                </option>
              ))}
            </select>
            {errors.actionOwner && touched.actionOwner && (
              <span className="error-message">{errors.actionOwner}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="targetDate">
              Target Completion Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.targetDate && touched.targetDate ? 'error' : ''}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.targetDate && touched.targetDate && (
              <span className="error-message">{errors.targetDate}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create CAPA'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CAPAForm;
