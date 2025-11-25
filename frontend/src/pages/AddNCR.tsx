import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createNCR, CreateNCRData } from '../services/ncrService';
import { getUsers } from '../services/userService';
import { getCurrentUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import { getAllSources, getAllTypes, getAllSeverities } from '../constants/ncrClassification';
import api from '../services/api';
import '../styles/AddNCR.css';

interface ExtendedNCRData extends CreateNCRData {
  rootCause?: string;
  containmentAction?: string;
  correctiveAction?: string;
}

function AddNCR() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState<ExtendedNCRData>({
    ncrNumber: '',
    title: '',
    description: '',
    source: '',
    category: '',
    status: 'open',
    severity: 'minor',
    detectedDate: new Date().toISOString().split('T')[0],
    reportedBy: 0,
    assignedTo: undefined,
    rootCause: '',
    containmentAction: '',
    correctiveAction: '',
  });

  useEffect(() => {
    loadCurrentUser();
    loadData();
  }, []);

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    
    if (user && user.id) {
      console.log('Current user loaded:', user);
      setCurrentUser(user);
      setFormData(prev => ({ ...prev, reportedBy: user.id }));
    } else {
      console.error('No user found or user ID missing:', user);
      toast.error('Unable to identify current user. Please log in again.');
      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const loadData = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.loadError'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedTo' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that reportedBy is set
    if (!formData.reportedBy || formData.reportedBy === 0) {
      toast.error('Unable to identify current user. Please refresh the page and try again.');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('Submitting NCR with data:', formData);
      
      // Create the NCR
      const response = await createNCR(formData);
      const ncrId = response.id;

      // Upload attachments if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          formDataFile.append('entityType', 'ncr');
          formDataFile.append('entityId', ncrId.toString());
          formDataFile.append('description', `NCR attachment: ${file.name}`);
          
          await api.post('/attachments', formDataFile, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      toast.success(t('messages.createSuccess'));
      navigate('/ncr');
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('messages.createError'));
    } finally {
      setLoading(false);
    }
  };

  const sourceOptions = getAllSources();
  const categoryOptions = getAllTypes();
  const severityOptions = getAllSeverities();

  return (
    <div className="add-ncr-page">
      <div className="page-header">
        <div>
          <button className="btn-secondary" onClick={() => navigate('/ncr')}>
            ← {t('common.back')}
          </button>
          <h1>{t('ncr.createNCR')}</h1>
          <p className="subtitle">{t('ncr.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="add-ncr-form">
        <div className="form-layout">
          {/* Left Column - Basic Information */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('ncr.basicInformation')}</h2>
              
              <div className="form-group">
                <label htmlFor="ncrNumber">
                  {t('ncr.ncrNumber')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="ncrNumber"
                  name="ncrNumber"
                  value={formData.ncrNumber}
                  onChange={handleInputChange}
                  maxLength={100}
                  required
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
            </div>
          </div>

          {/* Right Column - Details and Actions */}
          <div className="form-column">
            <div className="form-section">
              <h2>{t('ncr.detailsAndActions')}</h2>

              <div className="form-group">
                <label htmlFor="reportedBy">
                  {t('ncr.reportedBy')}
                </label>
                <input
                  type="text"
                  id="reportedBy"
                  value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">
                  {t('ncr.assignedTo')}
                </label>
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
                <label htmlFor="rootCause">
                  {t('ncr.rootCause')}
                </label>
                <textarea
                  id="rootCause"
                  name="rootCause"
                  value={formData.rootCause || ''}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('ncr.rootCause')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="containmentAction">
                  {t('ncr.containmentAction')}
                </label>
                <textarea
                  id="containmentAction"
                  name="containmentAction"
                  value={formData.containmentAction || ''}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('ncr.immediateAction')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="correctiveAction">
                  {t('ncr.correctiveAction')}
                </label>
                <textarea
                  id="correctiveAction"
                  name="correctiveAction"
                  value={formData.correctiveAction || ''}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={2000}
                  placeholder={t('ncr.correctiveAction')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="attachments">
                  {t('common.attachments')}
                </label>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                />
                {selectedFiles.length > 0 && (
                  <div className="file-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="btn-remove-file"
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
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/ncr')}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? t('common.saving') : t('ncr.createNCR')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddNCR;
