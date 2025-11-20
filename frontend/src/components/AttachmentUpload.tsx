import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  uploadAttachment, 
  deleteAttachment,
  getAttachmentsByEntity,
  Attachment 
} from '../services/attachmentService';
import AttachmentGallery from './AttachmentGallery';
import { useToast } from '../contexts/ToastContext';
import '../styles/AttachmentUpload.css';

interface AttachmentUploadProps {
  entityType: string;
  entityId: number;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

const AttachmentUpload = ({ entityType, entityId, onAttachmentsChange }: AttachmentUploadProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const toast = useToast();

  // Load attachments on mount
  useEffect(() => {
    loadAttachments();
  }, []);

  const loadAttachments = async () => {
    try {
      const response = await getAttachmentsByEntity(entityType, entityId);
      setAttachments(response.data);
      if (onAttachmentsChange) {
        onAttachmentsChange(response.data);
      }
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        await uploadAttachment(file, entityType, entityId, undefined, 'audit-document');
      }
      toast.success(t('common.uploadSuccess'));
      await loadAttachments();
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
      await loadAttachments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.deleteError'));
    }
  };

  if (loading) {
    return <div className="attachment-upload-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="attachment-upload-section">
      <div className="attachment-upload-header">
        <h3>{t('common.attachments')}</h3>
        <label className="tw-btn tw-btn-secondary" style={{ cursor: 'pointer', fontSize: '14px' }}>
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
  );
};

export default AttachmentUpload;
