import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createCAPA, CreateCAPAData } from '../services/capaService';
import { getUsers } from '../services/userService';
import { getNCRById } from '../services/ncrService';
import { getCurrentUser } from '../services/authService';
import { User } from '../types';
import FileUpload from '../components/FileUpload';
import { uploadAttachment } from '../services/attachmentService';
import '../styles/AddCAPA.css';

interface SelectedFile {
  file: File;
  preview: string;
}

function AddCAPA() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ncrIdParam = searchParams.get('ncrId');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<CreateCAPAData>({
    capaNumber: '',
    title: '',
    description: '',
    type: 'corrective',
    source: 'ncr',
    status: 'open',
    priority: 'medium',
    ncrId: ncrIdParam ? parseInt(ncrIdParam, 10) : undefined,
    proposedAction: '',
    actionOwner: 0,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);

      // Get current user
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setFormData((prev) => ({
          ...prev,
          actionOwner: user.id,
          createdBy: user.id,
        }));
      }

      // If ncrId is provided, pre-fill from NCR
      if (ncrIdParam) {
        const ncrId = parseInt(ncrIdParam, 10);
        const ncr = await getNCRById(ncrId);
        setFormData((prev) => ({
          ...prev,
          title: ncr.title,
          description: ncr.description || '',
          source: 'ncr',
          ncrId: ncrId,
        }));
      }

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('messages.loadError'));
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

  const handleFileSelect = (file: File) => {
    const preview = URL.createObjectURL(file);
    setSelectedFiles((prev) => [...prev, { file, preview }]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // Create CAPA
      const result = await createCAPA({
        ...formData,
        actionOwner: parseInt(formData.actionOwner.toString(), 10),
      });

      // Upload attachments if any
      if (selectedFiles.length > 0 && result.id) {
        await Promise.all(
          selectedFiles.map((sf) =>
            uploadAttachment(sf.file, 'capa', result.id, `CAPA attachment: ${sf.file.name}`)
          )
        );
      }

      // Navigate to the new CAPA
      navigate(`/capa/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || t('messages.createError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="add-capa-page">
      <div className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate('/capa')}>
            ← {t('common.back')}
          </button>
          <h1>{t('capa.createCAPA')}</h1>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="capa-form">
        <div className="form-layout">
          {/* Left Column */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('common.basicInfo')}</h2>

              <div className="form-group">
                <label htmlFor="capaNumber">
                  {t('capa.capaNumber')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="capaNumber"
                  name="capaNumber"
                  value={formData.capaNumber}
                  onChange={handleChange}
                  placeholder={t('capa.capaNumber')}
                  maxLength={100}
                  required
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
                  placeholder={t('capa.capaTitle')}
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
                  placeholder={t('capa.description')}
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">
                  {t('capa.capaType')} <span className="required">*</span>
                </label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                  <option value="corrective">{t('capa.types.corrective')}</option>
                  <option value="preventive">{t('capa.types.preventive')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="source">
                  {t('capa.source')} <span className="required">*</span>
                </label>
                <select id="source" name="source" value={formData.source} onChange={handleChange} required>
                  <option value="ncr">{t('capa.sources.ncr')}</option>
                  <option value="internal_audit">{t('capa.sources.internal_audit')}</option>
                  <option value="external_audit">{t('capa.sources.external_audit')}</option>
                  <option value="management_review">{t('capa.sources.management_review')}</option>
                  <option value="customer_complaint">{t('capa.sources.customer_complaint')}</option>
                  <option value="process_analysis">{t('capa.sources.process_analysis')}</option>
                  <option value="risk_assessment">{t('capa.sources.risk_assessment')}</option>
                  <option value="improvement_opportunity">{t('capa.sources.improvement_opportunity')}</option>
                  <option value="other">{t('capa.sources.other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">
                  {t('capa.priority')} <span className="required">*</span>
                </label>
                <select id="priority" name="priority" value={formData.priority} onChange={handleChange} required>
                  <option value="low">{t('capa.priorities.low')}</option>
                  <option value="medium">{t('capa.priorities.medium')}</option>
                  <option value="high">{t('capa.priorities.high')}</option>
                  <option value="urgent">{t('capa.priorities.urgent')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
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
                  placeholder={t('capa.proposedAction')}
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="actionOwner">
                  {t('capa.actionOwner')} <span className="required">*</span>
                </label>
                <select
                  id="actionOwner"
                  name="actionOwner"
                  value={formData.actionOwner}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t('capa.selectActionOwner')}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="targetDate">
                  {t('capa.targetDate')} <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="targetDate"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {ncrIdParam && (
                <div className="form-group">
                  <label>{t('capa.linkedNCR')}</label>
                  <div className="info-box">
                    <span className="info-icon">🔗</span>
                    <span>
                      {t('ncr.title')} #{ncrIdParam}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>{t('common.attachments')}</h2>

              <FileUpload
                onFileSelect={handleFileSelect}
                onUpload={async (file) => {
                  handleFileSelect(file);
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                maxSizeMB={10}
              />

              {selectedFiles.length > 0 && (
                <div className="file-preview-list">
                  {selectedFiles.map((sf, index) => (
                    <div key={index} className="file-preview-item">
                      <span className="file-name">{sf.file.name}</span>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveFile(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/capa')}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('common.creating') : t('capa.createCAPA')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddCAPA;
