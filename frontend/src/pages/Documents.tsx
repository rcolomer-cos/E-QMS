import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, DocumentFilters } from '../services/documentService';
import { Document } from '../types';
import '../styles/Documents.css';

function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({
    status: '',
    category: '',
    documentType: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
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
      setError(error.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="loading">Loading documents...</div>;
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1>Document Management</h1>
          <p className="subtitle">Manage and view quality documents</p>
        </div>
        <button className="tw-btn tw-btn-primary">Create Document</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search documents by title, description, type, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="obsolete">Obsolete</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="quality">Quality</option>
            <option value="safety">Safety</option>
            <option value="environmental">Environmental</option>
          </select>

          <select
            value={filters.documentType}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="policy">Policy</option>
            <option value="procedure">Procedure</option>
            <option value="work_instruction">Work Instruction</option>
            <option value="form">Form</option>
            <option value="record">Record</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Category</th>
              <th>Version</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {searchTerm ? 'No documents match your search' : 'No documents found'}
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
                      View
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
