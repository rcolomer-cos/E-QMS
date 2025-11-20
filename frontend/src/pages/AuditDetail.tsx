import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuditById } from '../services/auditService';
import { Audit } from '../types';
import { useTranslation } from 'react-i18next';
import { 
  getAttachmentsByEntity, 
  uploadAttachment, 
  deleteAttachment,
  Attachment 
} from '../services/attachmentService';
import AttachmentGallery from '../components/AttachmentGallery';
import { useToast } from '../contexts/ToastContext';

function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  useEffect(() => {
    loadAudit();
  }, [id]);

  const loadAudit = async () => {
    if (!id) return;
    try {
      const data = await getAuditById(parseInt(id, 10));
      setAudit(data);
      await loadAttachments(parseInt(id, 10));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async (auditId: number) => {
    try {
      const response = await getAttachmentsByEntity('audit', auditId);
      setAttachments(response.data);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !audit) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        await uploadAttachment(file, 'audit', audit.id!, undefined, 'audit-document');
      }
      toast.success(t('common.uploadSuccess'));
      await loadAttachments(audit.id!);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.uploadError'));
    } finally {
      setUploadingFile(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      toast.success(t('common.deleteSuccess'));
      await loadAttachments(audit!.id!);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.deleteError'));
    }
  };

  const handleExecute = () => navigate(`/audits/${audit!.id}/execute`);
  const handleFindings = () => navigate(`/audits/${audit!.id}/findings`);
  const handleEdit = () => navigate(`/audits/${audit!.id}/edit`);

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!audit) return <div className="error-message">{t('common.error')}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('audits.viewAudit')} – {audit.auditNumber}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="tw-btn tw-btn-secondary" onClick={() => navigate('/revisioner')}>{t('common.back')}</button>
          <button className="tw-btn tw-btn-primary" onClick={handleEdit}>{t('common.edit')}</button>
          {(audit.status === 'planned' || audit.status === 'in_progress') && (
            <button className="tw-btn tw-btn-primary" onClick={handleExecute}>{t('audits.execute')}</button>
          )}
          <button className="tw-btn" onClick={handleFindings}>{t('audits.findings')}</button>
        </div>
      </div>

      <div className="detail-section">
        <h2>{t('audits.summary')}</h2>
        <div className="detail-grid">
          <div className="detail-item"><label>{t('audits.auditTitle')}</label><span>{audit.title}</span></div>
          <div className="detail-item"><label>{t('audits.auditType')}</label><span>{t(`audits.${audit.auditType}`, audit.auditType)}</span></div>
          <div className="detail-item"><label>{t('audits.auditStatus')}</label><span>{t(`audits.${audit.status}`, audit.status)}</span></div>
          <div className="detail-item"><label>{t('audits.scheduledDate')}</label><span>{new Date(audit.scheduledDate).toLocaleDateString()}</span></div>
          <div className="detail-item"><label>{t('audits.auditor')}</label><span>{audit.leadAuditorId}</span></div>
          {audit.reviewedAt && <div className="detail-item"><label>{t('audits.reviewer')}</label><span>{new Date(audit.reviewedAt).toLocaleDateString()}</span></div>}
        </div>
      </div>

      {audit.scope && (
        <div className="detail-section">
          <h2>{t('audits.auditScope')}</h2>
          <p>{audit.scope}</p>
        </div>
      )}

      {audit.description && (
        <div className="detail-section">
          <h2>{t('common.description')}</h2>
          <p>{audit.description}</p>
        </div>
      )}

      {/* External Auditor Information - for external audits */}
      {(audit as any).externalAuditorName && (
        <div className="detail-section">
          <h2>{t('audits.externalAuditorInfo')}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>{t('audits.externalAuditorName')}</label>
              <span>{(audit as any).externalAuditorName}</span>
            </div>
            {(audit as any).externalAuditorOrganization && (
              <div className="detail-item">
                <label>{t('audits.externalAuditorOrganization')}</label>
                <span>{(audit as any).externalAuditorOrganization}</span>
              </div>
            )}
            {(audit as any).externalAuditorEmail && (
              <div className="detail-item">
                <label>{t('audits.externalAuditorEmail')}</label>
                <span>{(audit as any).externalAuditorEmail}</span>
              </div>
            )}
            {(audit as any).externalAuditorPhone && (
              <div className="detail-item">
                <label>{t('audits.externalAuditorPhone')}</label>
                <span>{(audit as any).externalAuditorPhone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachments Section */}
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>{t('common.attachments')}</h2>
          <label className="tw-btn tw-btn-primary" style={{ cursor: 'pointer' }}>
            {uploadingFile ? t('common.uploading') : t('common.uploadFile')}
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploadingFile}
            />
          </label>
        </div>
        <AttachmentGallery 
          attachments={attachments}
          onDelete={handleDeleteAttachment}
          canDelete={true}
        />
      </div>
    </div>
  );
}

export default AuditDetail;
