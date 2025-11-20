import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuditForm, { AuditFormData } from '../components/AuditForm';
import { getUsers } from '../services/userService';
import { getAuditById, updateAudit } from '../services/auditService';
import { User, Audit } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import AttachmentUpload from '../components/AttachmentUpload';
import '../styles/AuditForm.css';

function EditAudit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState<Audit | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      if (!id) {
        setError('Audit ID is required');
        return;
      }
      const [usersData, auditData] = await Promise.all([
        getUsers(),
        getAuditById(parseInt(id, 10)),
      ]);
      const auditorCandidates = usersData.filter(u => {
        const roleNames: string[] = (u as any).roleNames || ((u as any).roles?.map((r: any) => r.name)) || (u as any).role ? [(u as any).role] : [];
        return roleNames.some(r => ['manager','superuser'].includes(r.toLowerCase()));
      });
      setUsers(auditorCandidates);
      setAudit(auditData);
      setError('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || t('common.error');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: AuditFormData) => {
    if (!audit) return;
    try {
      await updateAudit(audit.id!, {
        title: data.title,
        description: data.description,
        auditType: data.auditType,
        scope: data.scope,
        scheduledDate: data.scheduledDate,
        leadAuditorId: data.leadAuditorId,
        department: data.department,
        auditCriteria: data.auditCriteria,
        relatedProcesses: data.relatedProcesses,
        externalAuditorName: data.externalAuditorName || undefined,
        externalAuditorOrganization: data.externalAuditorOrganization || undefined,
        externalAuditorEmail: data.externalAuditorEmail || undefined,
        externalAuditorPhone: data.externalAuditorPhone || undefined,
      });
      toast.showUpdateSuccess('Audit');
      navigate('/revisioner');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || t('common.error');
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    }
  };

  const handleCancel = () => {
    navigate('/revisioner');
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!audit) {
    return <div className="error-message">{t('common.error')}</div>;
  }

  const initialData: Partial<AuditFormData> = {
    title: audit.title,
    description: audit.description || '',
    auditType: audit.auditType,
    scope: audit.scope || '',
    scheduledDate: audit.scheduledDate ? audit.scheduledDate.slice(0, 10) : '',
    leadAuditorId: audit.leadAuditorId,
    department: (audit as any).department || '',
    auditCriteria: (audit as any).auditCriteria || '',
    relatedProcesses: (audit as any).relatedProcesses || '',
    externalAuditorName: (audit as any).externalAuditorName || '',
    externalAuditorOrganization: (audit as any).externalAuditorOrganization || '',
    externalAuditorEmail: (audit as any).externalAuditorEmail || '',
    externalAuditorPhone: (audit as any).externalAuditorPhone || '',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('audits.editAudit')}</h1>
        <p className="subtitle">{t('audits.editSubtitle')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-container">
        <AuditForm
          initialData={initialData}
          users={users}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={t('common.save')}
        />

        {/* Attachments Section */}
        <AttachmentUpload 
          entityType="audit"
          entityId={audit.id!}
        />
      </div>
    </div>
  );
}

export default EditAudit;
