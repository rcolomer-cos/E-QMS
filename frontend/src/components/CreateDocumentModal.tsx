import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createDocument } from '../services/documentService';
import { getProcesses } from '../services/processService';
import { useToast } from '../contexts/ToastContext';
import { Document, Process } from '../types';
import '../styles/Modal.css';

interface CreateDocumentModalProps {
  onClose: () => void;
  onSuccess: (documentId: number) => void;
}

function CreateDocumentModal({ onClose, onSuccess }: CreateDocumentModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [formData, setFormData] = useState<Partial<Document>>({
    title: '',
    description: '',
    documentType: 'procedure',
    category: '',
    version: '1.0',
    status: 'draft',
    complianceRequired: false,
  });

  useEffect(() => {
    const loadProcesses = async () => {
      try {
        const data = await getProcesses();
        setProcesses(data);
      } catch (error) {
        console.error('Failed to load processes:', error);
      }
    };
    loadProcesses();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error(t('documents.titleRequired'));
      return;
    }

    try {
      setLoading(true);
      const response = await createDocument(formData);
      toast.success(t('documents.createSuccess'));
      onSuccess(response.documentId);
    } catch (error: any) {
      console.error('Failed to create document:', error);
      const errorMsg = error.response?.data?.error || t('documents.createError');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('documents.createDocument')}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">
              {t('documents.documentTitle')} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('documents.titlePlaceholder')}
              required
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('common.description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('documents.descriptionPlaceholder')}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="documentType">
                {t('common.type')} <span className="required">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
              >
                <option value="policy">{t('documents.policy')}</option>
                <option value="procedure">{t('documents.procedure')}</option>
                <option value="work_instruction">{t('documents.workInstruction')}</option>
                <option value="form">{t('documents.form')}</option>
                <option value="record">Record</option>
                <option value="guideline">Guideline</option>
                <option value="manual">Manual</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="category">
                {t('processes.process')} <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">{t('processes.selectProcess')}</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.name}>
                    {process.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="version">{t('documents.version')}</label>
              <input
                type="text"
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="1.0"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">{t('common.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">{t('documents.draft')}</option>
                <option value="review">{t('improvements.underReview')}</option>
                <option value="approved">{t('common.approved')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="complianceRequired"
                checked={formData.complianceRequired}
                onChange={handleChange}
              />
              {t('documents.complianceRequired')}
            </label>
            <p className="field-hint">{t('documents.complianceHint')}</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="effectiveDate">{t('documents.effectiveDate')}</label>
              <input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={formData.effectiveDate || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reviewDate">{t('documents.reviewDate')}</label>
              <input
                type="date"
                id="reviewDate"
                name="reviewDate"
                value={formData.reviewDate || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">{t('documents.expiryDate')}</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate || ''}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('common.loading') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDocumentModal;
