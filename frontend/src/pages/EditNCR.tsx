import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNCRById, updateNCR, updateNCRStatus, UpdateNCRData } from '../services/ncrService';
import { getUsers } from '../services/userService';
import { getAttachmentsByEntity, deleteAttachment, uploadAttachment } from '../services/attachmentService';
import { useToast } from '../contexts/ToastContext';
import { NCR as NCRType, User } from '../types';
import { Attachment } from '../services/attachmentService';
import { getAllSources, getAllTypes, getAllSeverities } from '../constants/ncrClassification';
import AttachmentGallery from '../components/AttachmentGallery';
import FileUpload from '../components/FileUpload';
import '../styles/EditNCR.css';

function EditNCR() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [ncr, setNcr] = useState<NCRType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const [formData, setFormData] = useState<UpdateNCRData & { 
    ncrNumber?: string;
    source?: string;
    category?: string;
    severity?: string;
    detectedDate?: string;
    reportedBy?: number;
  }>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [ncrData, usersData, attachmentsData] = await Promise.all([
        getNCRById(parseInt(id, 10)),
        getUsers(),
        getAttachmentsByEntity('ncr', parseInt(id, 10)),
      ]);

      setNcr(ncrData);
      setUsers(usersData);
      setAttachments(attachmentsData.data);
      
      // Initialize form data with NCR values
      setFormData({
        ncrNumber: ncrData.ncrNumber,
        title: ncrData.title,
        description: ncrData.description,
        source: ncrData.source,
        category: ncrData.category,
        severity: ncrData.severity,
        status: ncrData.status,
        detectedDate: ncrData.detectedDate,
        reportedBy: ncrData.reportedBy,
        assignedTo: ncrData.assignedTo,
        rootCause: ncrData.rootCause || '',
        containmentAction: ncrData.containmentAction || '',
        correctiveAction: ncrData.correctiveAction || '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.loadError'));
      navigate('/ncr');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedTo' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    try {
      setSaving(true);

      // Prepare update data
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        source: formData.source,
        category: formData.category,
        severity: formData.severity,
        detectedDate: formData.detectedDate,
        assignedTo: formData.assignedTo,
        rootCause: formData.rootCause,
        containmentAction: formData.containmentAction,
        correctiveAction: formData.correctiveAction,
      };

      await updateNCR(parseInt(id, 10), updateData);
      
      // Update status separately if changed
      if (formData.status && formData.status !== ncr?.status) {
        await updateNCRStatus(parseInt(id, 10), formData.status);
      }

      toast.success(t('messages.updateSuccess'));
      navigate(`/ncr/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const getUserName = (userId?: number) => {
    if (!userId) return t('ncr.unassigned');
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : t('common.unknown');
  };

  const handleFileUpload = async (file: File) => {
    if (!id) return;

    try {
      await uploadAttachment(file, 'ncr', parseInt(id, 10), `NCR attachment: ${file.name}`);
      const attachmentsData = await getAttachmentsByEntity('ncr', parseInt(id, 10));
      setAttachments(attachmentsData.data);
      toast.success(t('common.uploadSuccess'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.uploadError'));
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return;

    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      toast.success(t('common.deleteSuccess'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.deleteError'));
    }
  };

  const sourceOptions = getAllSources();
  const categoryOptions = getAllTypes();
  const severityOptions = getAllSeverities();

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!ncr) {
    return <div className="error-message">NCR not found</div>;
  }

  return (
    <div className="edit-ncr-page">
      <div className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate(`/ncr/${id}`)}>
            ← {t('common.back')}
          </button>
          <h1>{t('ncr.editNCR')}</h1>
          <p className="subtitle">{ncr.ncrNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-ncr-form">
        <div className="form-layout">
          {/* Left Column - Basic Information */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('ncr.basicInformation')}</h2>

              <div className="form-group">
                <label htmlFor="ncrNumber">{t('ncr.ncrNumber')}</label>
                <input
                  type="text"
                  id="ncrNumber"
                  name="ncrNumber"
                  value={formData.ncrNumber}
                  disabled
                  className="disabled-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">
                  {t('ncr.ncrTitle')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={500}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  {t('ncr.description')} <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source">
                    {t('ncr.source')} <span className="required">*</span>
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">{t('common.select')}</option>
                    {sourceOptions.map((option) => (
                      <option key={option} value={option}>
                        {t(`ncr.sources.${option}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">
                    {t('ncr.category')} <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">{t('common.select')}</option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {t(`ncr.categories.${option}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="severity">
                    {t('ncr.severity')} <span className="required">*</span>
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    required
                  >
                    {severityOptions.map((option) => (
                      <option key={option} value={option}>
                        {t(`ncr.severities.${option}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="detectedDate">
                    {t('ncr.detectedDate')} <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="detectedDate"
                    name="detectedDate"
                    value={formData.detectedDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reportedBy">{t('ncr.reportedBy')}</label>
                <input
                  type="text"
                  id="reportedBy"
                  value={getUserName(formData.reportedBy)}
                  disabled
                  className="disabled-field"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Details and Actions */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('ncr.detailsAndActions')}</h2>

              <div className="form-group">
                <label htmlFor="status">
                  {t('common.status')} <span className="required">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="open">{t('ncr.statusOpen')}</option>
                  <option value="in_progress">{t('ncr.statusInProgress')}</option>
                  <option value="resolved">{t('ncr.statusResolved')}</option>
                  <option value="closed">{t('ncr.statusClosed')}</option>
                  <option value="rejected">{t('ncr.statusRejected')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">{t('ncr.assignedTo')}</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo || ''}
                  onChange={handleInputChange}
                >
                  <option value="">{t('ncr.unassigned')}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rootCause">{t('ncr.rootCause')}</label>
                <textarea
                  id="rootCause"
                  name="rootCause"
                  value={formData.rootCause}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={1000}
                  placeholder={t('ncr.rootCausePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="containmentAction">{t('ncr.containmentAction')}</label>
                <textarea
                  id="containmentAction"
                  name="containmentAction"
                  value={formData.containmentAction}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={1000}
                  placeholder={t('ncr.containmentActionPlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="correctiveAction">{t('ncr.correctiveAction')}</label>
                <textarea
                  id="correctiveAction"
                  name="correctiveAction"
                  value={formData.correctiveAction}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={1000}
                  placeholder={t('ncr.correctiveActionPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="attachments-section">
          <div className="section-header">
            <h2>{t('common.attachments')}</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              {showUploadSection ? t('common.cancel') : t('common.uploadFile')}
            </button>
          </div>

          {showUploadSection && (
            <FileUpload
              onFileSelect={() => {}}
              onUpload={handleFileUpload}
              accept="*/*"
              maxSizeMB={10}
            />
          )}

          <AttachmentGallery
            attachments={attachments}
            onDelete={handleDeleteAttachment}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate(`/ncr/${id}`)}
            disabled={saving}
          >
            {t('common.cancel')}
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={saving}
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditNCR;
