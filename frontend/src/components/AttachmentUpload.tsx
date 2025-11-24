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
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load attachments on mount
  useEffect(() => {
    loadAttachments();
  }, [entityType, entityId]);

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
        await uploadAttachment(file, entityType, entityId, undefined, 'equipment-document');
      }
      toast.success(t('attachments.uploadSuccess'));
      await loadAttachments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('attachments.uploadError'));
    } finally {
      setUploadingFile(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      toast.success(t('attachments.deleteSuccess'));
      await loadAttachments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('attachments.deleteError'));
    }
  };

  if (loading) {
    return <div className="attachment-upload-loading">{t('attachments.loading')}</div>;
  }

  return (
    <div className="attachment-upload-section">
      <div className="attachment-upload-header">
        <h3>{t('attachments.title')}</h3>
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          {uploadingFile ? t('attachments.uploading') : t('attachments.uploadFiles')}
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
