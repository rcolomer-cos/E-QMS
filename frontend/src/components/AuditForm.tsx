import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';

export interface AuditFormData {
  title: string;
  description: string;
  auditType: string;
  scope: string;
  scheduledDate: string;
  leadAuditorId: number; // always number after validation
  department: string;
  auditCriteria: string;
  relatedProcesses: string;
  externalAuditorName: string;
  externalAuditorOrganization: string;
  externalAuditorEmail: string;
  externalAuditorPhone: string;
}

interface AuditFormProps {
  initialData?: Partial<AuditFormData>;
  users: User[];
  onSubmit: (data: AuditFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

function AuditForm({ initialData, users, onSubmit, onCancel, submitLabel = 'Schedule Audit' }: AuditFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<AuditFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    auditType: initialData?.auditType || 'internal',
    scope: initialData?.scope || '',
    scheduledDate: initialData?.scheduledDate || '',
    leadAuditorId: (initialData?.leadAuditorId as number) || 0,
    department: initialData?.department || '',
    auditCriteria: initialData?.auditCriteria || '',
    relatedProcesses: initialData?.relatedProcesses || '',
    externalAuditorName: (initialData as any)?.externalAuditorName || '',
    externalAuditorOrganization: (initialData as any)?.externalAuditorOrganization || '',
    externalAuditorEmail: (initialData as any)?.externalAuditorEmail || '',
    externalAuditorPhone: (initialData as any)?.externalAuditorPhone || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const isExternalAudit = ['external', 'surveillance', 'certification'].includes(formData.auditType);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leadAuditorId' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.scope.trim()) {
      setError('Scope is required');
      return;
    }
    if (!formData.scheduledDate) {
      setError('Scheduled date is required');
      return;
    }
    if (!formData.leadAuditorId || isNaN(formData.leadAuditorId)) {
      setError('Lead auditor is required');
      return;
    }

    setError('');
    setSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save audit');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="audit-form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-row">
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
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="auditType">
            Audit Type <span className="required">*</span>
          </label>
          <select
            id="auditType"
            name="auditType"
            value={formData.auditType}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="surveillance">Surveillance</option>
            <option value="certification">Certification</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="scope">
          Scope <span className="required">*</span>
        </label>
        <textarea
          id="scope"
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          rows={3}
          required
          disabled={submitting}
          placeholder="Describe the audit scope..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="scheduledDate">
            Scheduled Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="scheduledDate"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            required
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="leadAuditorId">
            {isExternalAudit ? t('audits.internalCoordinator') : t('audits.leadAuditor')} <span className="required">*</span>
          </label>
          <select
            id="leadAuditorId"
            name="leadAuditorId"
            value={formData.leadAuditorId || ''}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="">{isExternalAudit ? t('audits.internalCoordinator') : t('audits.leadAuditor')}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* External Auditor Information - only for external audits */}
      {isExternalAudit && (
        <>
          <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '18px', color: '#333' }}>
            {t('audits.externalAuditorInfo')}
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="externalAuditorName">{t('audits.externalAuditorName')}</label>
              <input
                type="text"
                id="externalAuditorName"
                name="externalAuditorName"
                value={formData.externalAuditorName}
                onChange={handleChange}
                disabled={submitting}
                placeholder={t('audits.externalAuditorName')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="externalAuditorOrganization">{t('audits.externalAuditorOrganization')}</label>
              <input
                type="text"
                id="externalAuditorOrganization"
                name="externalAuditorOrganization"
                value={formData.externalAuditorOrganization}
                onChange={handleChange}
                disabled={submitting}
                placeholder={t('audits.externalAuditorOrganization')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="externalAuditorEmail">{t('audits.externalAuditorEmail')}</label>
              <input
                type="email"
                id="externalAuditorEmail"
                name="externalAuditorEmail"
                value={formData.externalAuditorEmail}
                onChange={handleChange}
                disabled={submitting}
                placeholder={t('audits.externalAuditorEmail')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="externalAuditorPhone">{t('audits.externalAuditorPhone')}</label>
              <input
                type="tel"
                id="externalAuditorPhone"
                name="externalAuditorPhone"
                value={formData.externalAuditorPhone}
                onChange={handleChange}
                disabled={submitting}
                placeholder={t('audits.externalAuditorPhone')}
              />
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="department">Department</label>
        <input
          type="text"
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          disabled={submitting}
          placeholder="Department or area being audited"
        />
      </div>

      <div className="form-group">
        <label htmlFor="auditCriteria">Audit Criteria</label>
        <textarea
          id="auditCriteria"
          name="auditCriteria"
          value={formData.auditCriteria}
          onChange={handleChange}
          rows={3}
          disabled={submitting}
          placeholder="Standards, procedures, or requirements to audit against"
        />
      </div>

      <div className="form-group">
        <label htmlFor="relatedProcesses">Related Processes</label>
        <textarea
          id="relatedProcesses"
          name="relatedProcesses"
          value={formData.relatedProcesses}
          onChange={handleChange}
          rows={3}
          disabled={submitting}
          placeholder="Processes or procedures related to this audit"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="tw-btn tw-btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="tw-btn tw-btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default AuditForm;
