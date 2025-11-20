import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuditForm from '../components/AuditForm';
import { getUsers } from '../services/userService';
import { createAudit } from '../services/auditService';
import { User } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import '../styles/AuditForm.css';

interface AuditFormData {
  title: string;
  description: string;
  auditType: string;
  scope: string;
  scheduledDate: string;
  leadAuditorId: number; // ensure number type for compatibility
  department: string;
  auditCriteria: string;
  relatedProcesses: string;
  externalAuditorName: string;
  externalAuditorOrganization: string;
  externalAuditorEmail: string;
  externalAuditorPhone: string;
}

function ScheduleAudit() {
  const navigate = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      const auditorCandidates = usersData.filter(u => {
        const roleNames: string[] = u.roleNames || u.roles?.map((r: any) => r.name) || (u.role ? [u.role] : []);
        return roleNames.some(r => ['manager','superuser','auditor'].includes(r.toLowerCase()));
      });
      setUsers(auditorCandidates);
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
    try {
      const result = await createAudit({
        title: data.title,
        description: data.description,
        auditType: data.auditType,
        scope: data.scope,
        scheduledDate: data.scheduledDate,
        leadAuditorId: data.leadAuditorId,
        department: data.department,
        auditCriteria: data.auditCriteria,
        relatedProcesses: data.relatedProcesses,
        status: 'planned',
        externalAuditorName: data.externalAuditorName || undefined,
        externalAuditorOrganization: data.externalAuditorOrganization || undefined,
        externalAuditorEmail: data.externalAuditorEmail || undefined,
        externalAuditorPhone: data.externalAuditorPhone || undefined,
      });
      toast.showCreateSuccess(`${t('audits.createAudit')}: ${result.auditNumber}`);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('audits.scheduleAudit')}</h1>
        <p className="subtitle">{t('audits.scheduleSubtitle')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-container">
        <AuditForm
          users={users}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={t('audits.scheduleAudit')}
        />
      </div>
    </div>
  );
}

export default ScheduleAudit;
