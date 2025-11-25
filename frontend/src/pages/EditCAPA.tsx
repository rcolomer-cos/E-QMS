import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCAPAById, updateCAPA, UpdateCAPAData } from '../services/capaService';
import { getUsers } from '../services/userService';
import { getAttachmentsByEntity, deleteAttachment, uploadAttachment } from '../services/attachmentService';
import { useToast } from '../contexts/ToastContext';
import { CAPA, User } from '../types';
import { Attachment } from '../services/attachmentService';
import AttachmentGallery from '../components/AttachmentGallery';
import FileUpload from '../components/FileUpload';
import '../styles/EditCAPA.css';

function EditCAPA() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [capa, setCapa] = useState<CAPA | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const [formData, setFormData] = useState<UpdateCAPAData & {
    capaNumber?: string;
    type?: 'corrective' | 'preventive';
    source?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    ncrId?: number;
    targetDate?: string;
    actionOwner?: number;
  }>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [capaData, usersData, attachmentsData] = await Promise.all([
        getCAPAById(parseInt(id, 10)),
        getUsers(),
        getAttachmentsByEntity('capa', parseInt(id, 10)),
      ]);

      setCapa(capaData);
      setUsers(usersData);
      setAttachments(attachmentsData.data);

      // Initialize form data
      setFormData({
        capaNumber: capaData.capaNumber,
        title: capaData.title,
        description: capaData.description,
        type: capaData.type,
        source: capaData.source,
        priority: capaData.priority,
        proposedAction: capaData.proposedAction,
        rootCause: capaData.rootCause || '',
        effectiveness: capaData.effectiveness || '',
        ncrId: capaData.ncrId,
        targetDate: capaData.targetDate ? new Date(capaData.targetDate).toISOString().split('T')[0] : '',
        actionOwner: capaData.actionOwner,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.loadError'));
      navigate('/capa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      await updateCAPA(parseInt(id!, 10), {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        proposedAction: formData.proposedAction,
        rootCause: formData.rootCause,
        effectiveness: formData.effectiveness,
      });

      toast.success(t('messages.updateSuccess'));
      navigate(`/capa/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!capa) return;

    try {
      await uploadAttachment(file, 'capa', capa.id!, `CAPA attachment: ${file.name}`);
      const attachmentsData = await getAttachmentsByEntity('capa', capa.id!);
      setAttachments(attachmentsData.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.uploadError'));
      throw err;
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.deleteError'));
      throw err;
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!capa) {
    return null;
  }

  return (
    <div className="edit-capa-page">
      <div className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate(`/capa/${id}`)}>
            ← {t('common.back')}
          </button>
          <h1>{t('capa.editCAPA')}</h1>
          <p className="subtitle">{capa.capaNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-capa-form">
        <div className="form-layout">
          {/* Left Column - Basic Information */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('common.basicInfo')}</h2>

              <div className="form-group">
                <label htmlFor="capaNumber">{t('capa.capaNumber')}</label>
                <input
                  type="text"
                  id="capaNumber"
                  name="capaNumber"
                  value={formData.capaNumber}
                  disabled
                  className="read-only"
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">
                  {t('capa.capaTitle')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={500}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  {t('capa.description')} <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">{t('capa.capaType')}</label>
                <select id="type" name="type" value={formData.type} disabled className="read-only">
                  <option value="corrective">{t('capa.types.corrective')}</option>
                  <option value="preventive">{t('capa.types.preventive')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="source">{t('capa.source')}</label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  disabled
                  className="read-only"
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">
                  {t('capa.priority')} <span className="required">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="low">{t('capa.priorities.low')}</option>
                  <option value="medium">{t('capa.priorities.medium')}</option>
                  <option value="high">{t('capa.priorities.high')}</option>
                  <option value="urgent">{t('capa.priorities.urgent')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column - Actions and Details */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('capa.proposedAction')}</h2>

              <div className="form-group">
                <label htmlFor="proposedAction">
                  {t('capa.proposedAction')} <span className="required">*</span>
                </label>
                <textarea
                  id="proposedAction"
                  name="proposedAction"
                  value={formData.proposedAction}
                  onChange={handleChange}
                  rows={4}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rootCause">{t('capa.rootCause')}</label>
                <textarea
                  id="rootCause"
                  name="rootCause"
                  value={formData.rootCause}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('capa.rootCause')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="effectiveness">{t('capa.effectiveness')}</label>
                <textarea
                  id="effectiveness"
                  name="effectiveness"
                  value={formData.effectiveness}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('capa.effectiveness')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="actionOwner">{t('capa.actionOwner')}</label>
                <input
                  type="text"
                  value={users.find(u => u.id === formData.actionOwner)?.firstName + ' ' + users.find(u => u.id === formData.actionOwner)?.lastName || ''}
                  disabled
                  className="read-only"
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetDate">{t('capa.targetDate')}</label>
                <input
                  type="date"
                  id="targetDate"
                  name="targetDate"
                  value={formData.targetDate}
                  disabled
                  className="read-only"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>{t('common.attachments')} ({attachments.length})</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowUploadSection(!showUploadSection)}
            >
              {showUploadSection ? `✕ ${t('common.cancel')}` : `+ ${t('common.add')}`}
            </button>
          </div>

          {showUploadSection && (
            <div className="upload-section">
              <FileUpload
                onFileSelect={(file) => console.log('File selected:', file.name)}
                onUpload={async (file) => {
                  await handleFileUpload(file);
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                maxSizeMB={10}
              />
            </div>
          )}

          <AttachmentGallery
            attachments={attachments}
            onDelete={handleDeleteAttachment}
            canDelete={true}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/capa/${id}`)}
          >
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditCAPA;
