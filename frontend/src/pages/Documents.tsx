import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDocuments, DocumentFilters } from '../services/documentService';
import { useToast } from '../contexts/ToastContext';
import { Document, Process } from '../types';
import { getProcesses } from '../services/processService';
import '../styles/Documents.css';

function Documents() {
  const { t } = useTranslation();
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({
    status: '',
    category: '',
    documentType: '',
    processId: undefined,
    includeSubProcesses: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
    loadProcesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    filterDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, documents]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await getDocuments(filters);
      setDocuments(data);
      setError('');
    } catch (err) {
      console.error('Failed to load documents:', err);
      const error = err as { response?: { data?: { error?: string } } };
      const errorMsg = error.response?.data?.error || t('messages.loadError');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      const data = await getProcesses();
      setProcesses(data);
    } catch (err) {
      console.error('Failed to load processes:', err);
    }
  };

  const filterDocuments = () => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.documentType.toLowerCase().includes(term) ||
        doc.category.toLowerCase().includes(term) ||
        doc.version.toLowerCase().includes(term)
    );
    setFilteredDocuments(filtered);
  };

  const handleViewDocument = (id: number) => {
    navigate(`/documents/${id}`);
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleProcessFilterChange = (value: string) => {
    setFilters({
      ...filters,
      processId: value ? parseInt(value, 10) : undefined,
    });
  };

  const handleIncludeSubToggle = (checked: boolean) => {
    setFilters({ ...filters, includeSubProcesses: checked });
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1>{t('documents.title')}</h1>
          <p className="subtitle">{t('documents.allDocuments')}</p>
        </div>
        <button className="tw-btn tw-btn-primary">{t('documents.createDocument')}</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={filters.processId || ''}
            onChange={(e) => handleProcessFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">{t('processes.allProcesses')}</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={!!filters.includeSubProcesses}
              onChange={(e) => handleIncludeSubToggle(e.target.checked)}
            />
            {t('processes.processInputs')}
          </label>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">{t('common.all')} {t('common.status')}</option>
            <option value="draft">{t('documents.draft')}</option>
            <option value="review">{t('improvements.underReview')}</option>
            <option value="approved">{t('common.approved')}</option>
            <option value="obsolete">{t('documents.archived')}</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">{t('common.all')} {t('common.category')}</option>
            <option value="quality">Quality</option>
            <option value="safety">Safety</option>
            <option value="environmental">Environmental</option>
          </select>

          <select
            value={filters.documentType}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            className="filter-select"
          >
            <option value="">{t('common.all')} {t('common.type')}</option>
            <option value="policy">{t('documents.policy')}</option>
            <option value="procedure">{t('documents.procedure')}</option>
            <option value="work_instruction">{t('documents.workInstruction')}</option>
            <option value="form">{t('documents.form')}</option>
            <option value="record">Record</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('documents.documentTitle')}</th>
              <th>{t('common.type')}</th>
              <th>{t('common.category')}</th>
              <th>{t('documents.version')}</th>
              <th>{t('common.status')}</th>
              <th>{t('users.createdDate')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {searchTerm ? t('messages.noResults') : t('messages.noData')}
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="title-cell">{doc.title}</td>
                  <td>{doc.documentType}</td>
                  <td>{doc.category}</td>
                  <td>
                    <span className="version-badge">{doc.version}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${doc.status}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Documents;
