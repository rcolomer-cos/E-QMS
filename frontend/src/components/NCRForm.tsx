import { useState, FormEvent, ChangeEvent } from 'react';
import { CreateNCRData } from '../services/ncrService';
import { User } from '../types';
import FileUpload from './FileUpload';

interface NCRFormProps {
  onSubmit: (data: CreateNCRData, files: File[]) => Promise<void>;
  onCancel: () => void;
  users: User[];
  currentUserId: number;
}

interface FormErrors {
  ncrNumber?: string;
  title?: string;
  description?: string;
  source?: string;
  category?: string;
  severity?: string;
  detectedDate?: string;
}

const NCRForm = ({ onSubmit, onCancel, users, currentUserId }: NCRFormProps) => {
  const [formData, setFormData] = useState<CreateNCRData>({
    ncrNumber: '',
    title: '',
    description: '',
    source: '',
    category: '',
    status: 'open',
    severity: 'minor',
    detectedDate: new Date().toISOString().split('T')[0],
    reportedBy: currentUserId,
    assignedTo: undefined,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Predefined options for dropdowns
  const sourceOptions = [
    'Internal Audit',
    'External Audit',
    'Customer Complaint',
    'Supplier Issue',
    'Process Monitoring',
    'Inspection',
    'Management Review',
    'Employee Report',
    'Other',
  ];

  const categoryOptions = [
    'Product Quality',
    'Process Deviation',
    'Documentation',
    'Equipment/Facility',
    'Personnel/Training',
    'Safety',
    'Environmental',
    'Regulatory Compliance',
    'Supplier Quality',
    'Other',
  ];

  // Validate field
  const validateField = (name: keyof CreateNCRData, value: any): string | undefined => {
    switch (name) {
      case 'ncrNumber':
        if (!value || value.trim().length === 0) {
          return 'NCR Number is required';
        }
        if (value.length > 100) {
          return 'NCR Number must not exceed 100 characters';
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
      case 'category':
        if (!value || value.trim().length === 0) {
          return 'Category is required';
        }
        if (value.length > 100) {
          return 'Category must not exceed 100 characters';
        }
        break;
      case 'severity':
        if (!value) {
          return 'Severity is required';
        }
        break;
      case 'detectedDate':
        if (!value) {
          return 'Detected Date is required';
        }
        break;
    }
    return undefined;
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    newErrors.ncrNumber = validateField('ncrNumber', formData.ncrNumber);
    newErrors.title = validateField('title', formData.title);
    newErrors.description = validateField('description', formData.description);
    newErrors.source = validateField('source', formData.source);
    newErrors.category = validateField('category', formData.category);
    newErrors.severity = validateField('severity', formData.severity);
    newErrors.detectedDate = validateField('detectedDate', formData.detectedDate);

    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  // Handle input change with real-time validation
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'assignedTo' ? (value ? parseInt(value, 10) : undefined) : value,
    }));

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name as keyof CreateNCRData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  // Handle blur event to mark field as touched and validate
  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof CreateNCRData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // File is validated by FileUpload component
    console.log('File selected:', file.name);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    // Add file to the list of files to be uploaded after NCR creation
    setSelectedFiles((prev) => [...prev, file]);
    console.log('File ready for upload:', file.name);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = ['ncrNumber', 'title', 'description', 'source', 'category', 'severity', 'detectedDate'];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData, selectedFiles);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ncr-form">
      <div className="form-grid">
        {/* NCR Number */}
        <div className="form-group">
          <label htmlFor="ncrNumber">
            NCR Number <span className="required">*</span>
          </label>
          <input
            type="text"
            id="ncrNumber"
            name="ncrNumber"
            value={formData.ncrNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., NCR-2024-001"
            maxLength={100}
            className={errors.ncrNumber && touched.ncrNumber ? 'error' : ''}
          />
          {errors.ncrNumber && touched.ncrNumber && (
            <span className="error-message">{errors.ncrNumber}</span>
          )}
          <span className="field-hint">Unique identifier for this NCR</span>
        </div>

        {/* Severity */}
        <div className="form-group">
          <label htmlFor="severity">
            Severity <span className="required">*</span>
          </label>
          <select
            id="severity"
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.severity && touched.severity ? 'error' : ''}
          >
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="critical">Critical</option>
          </select>
          {errors.severity && touched.severity && (
            <span className="error-message">{errors.severity}</span>
          )}
        </div>

        {/* Title */}
        <div className="form-group full-width">
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
            placeholder="Brief summary of the non-conformance"
            maxLength={500}
            className={errors.title && touched.title ? 'error' : ''}
          />
          {errors.title && touched.title && (
            <span className="error-message">{errors.title}</span>
          )}
          <span className="field-hint">
            {formData.title.length}/500 characters
          </span>
        </div>

        {/* Description */}
        <div className="form-group full-width">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Detailed description of the non-conformance, including what was observed and why it is a non-conformance"
            rows={5}
            maxLength={2000}
            className={errors.description && touched.description ? 'error' : ''}
          />
          {errors.description && touched.description && (
            <span className="error-message">{errors.description}</span>
          )}
          <span className="field-hint">
            {formData.description.length}/2000 characters
          </span>
        </div>

        {/* Source */}
        <div className="form-group">
          <label htmlFor="source">
            Source <span className="required">*</span>
          </label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.source && touched.source ? 'error' : ''}
          >
            <option value="">Select source...</option>
            {sourceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.source && touched.source && (
            <span className="error-message">{errors.source}</span>
          )}
          <span className="field-hint">Where was this NCR identified?</span>
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category">
            Category <span className="required">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.category && touched.category ? 'error' : ''}
          >
            <option value="">Select category...</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.category && touched.category && (
            <span className="error-message">{errors.category}</span>
          )}
          <span className="field-hint">Type of non-conformance</span>
        </div>

        {/* Detected Date */}
        <div className="form-group">
          <label htmlFor="detectedDate">
            Detected Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="detectedDate"
            name="detectedDate"
            value={formData.detectedDate}
            onChange={handleChange}
            onBlur={handleBlur}
            max={new Date().toISOString().split('T')[0]}
            className={errors.detectedDate && touched.detectedDate ? 'error' : ''}
          />
          {errors.detectedDate && touched.detectedDate && (
            <span className="error-message">{errors.detectedDate}</span>
          )}
        </div>

        {/* Assigned To */}
        <div className="form-group">
          <label htmlFor="assignedTo">Assigned To</label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo || ''}
            onChange={handleChange}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
          <span className="field-hint">
            Optional: Assign to a team member for resolution
          </span>
        </div>
      </div>

      {/* File Attachments Section */}
      <div className="form-section">
        <h3>File Attachments</h3>
        <p className="section-description">
          Upload supporting documents, photos, or evidence related to this NCR (optional)
        </p>
        <FileUpload
          onFileSelect={handleFileSelect}
          onUpload={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          maxSizeMB={10}
          disabled={submitting}
        />
        {selectedFiles.length > 0 && (
          <div className="selected-files-list">
            <p className="files-count">
              {selectedFiles.length} file(s) ready to upload
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={submitting}
        >
          {submitting ? 'Creating NCR...' : 'Create NCR'}
        </button>
      </div>
    </form>
  );
};

export default NCRForm;
