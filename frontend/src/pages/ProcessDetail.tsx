import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProcessById, getProcessDocuments, linkDocumentToProcess, unlinkDocumentFromProcess, updateProcess } from '../services/processService';
import { getDocuments } from '../services/documentService';
import { Document, Process } from '../types';
import { useAuth } from '../services/authService';
import FlowchartEditor from '../components/FlowchartEditor';
import FlowchartViewer from '../components/FlowchartViewer';
import '../styles/Processes.css';
import '../styles/Documents.css';

function ProcessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [process, setProcess] = useState<Process | null>(null);
  const [linkedDocuments, setLinkedDocuments] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Role checking helper
  const normalizeRole = (r: string) => r?.trim().toLowerCase() || '';
  const roleNames: string[] = ((user?.roles?.map(r => r.name)) || (user?.role ? [user.role as string] : [])) as string[];
  const roleNamesLower = roleNames.map(normalizeRole);
  const hasRole = (r: string) => roleNamesLower.includes(r.toLowerCase());
  const canEditFlowchart = hasRole('superuser') || hasRole('manager');

  useEffect(() => {
    if (!id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const pid = parseInt(id, 10);
      const [proc, linked, all] = await Promise.all([
        getProcessById(pid),
        getProcessDocuments(pid),
        getDocuments({}),
      ]);
      setProcess(proc);
      setLinkedDocuments(linked);
      setAllDocuments(all);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load process');
    } finally {
      setLoading(false);
    }
  };

  const parentLabel = useMemo(() => {
    if (!process) return '-';
    return process.parentProcessId ? `Parent ID: ${process.parentProcessId}` : '—';
  }, [process]);

  const linkedDocumentIds = useMemo(() => new Set(linkedDocuments.map((ld: any) => ld.id)), [linkedDocuments]);

  const availableDocuments = useMemo(() => {
    const filtered = allDocuments.filter(d => !linkedDocumentIds.has(d.id));
    if (!searchTerm) return filtered;
    const term = searchTerm.toLowerCase();
    return filtered.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.documentType.toLowerCase().includes(term) ||
      d.category.toLowerCase().includes(term)
    );
  }, [allDocuments, linkedDocumentIds, searchTerm]);

  const handleLinkDocument = async (documentId: number) => {
    if (!id) return;
    try {
      await linkDocumentToProcess(parseInt(id, 10), documentId);
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link document');
    }
  };

  const handleUnlinkDocument = async (documentId: number) => {
    if (!id || !window.confirm('Unlink this document from the process?')) return;
    try {
      await unlinkDocumentFromProcess(parseInt(id, 10), documentId);
      await loadData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to unlink document');
    }
  };

  const handleSaveFlowchart = async (flowchartData: { nodes: any[]; edges: any[] }) => {
    if (!id || !process) return;
    try {
      // Only send fields that should be updated, exclude code (auto-generated)
      await updateProcess(parseInt(id, 10), {
        flowchartSvg: JSON.stringify(flowchartData)
      });
      await loadData();
      setError('');
      alert('Flowchart saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save flowchart');
    }
  };

  const flowchartData = useMemo(() => {
    if (!process?.flowchartSvg) return null;
    try {
      return JSON.parse(process.flowchartSvg);
    } catch {
      return null;
    }
  }, [process?.flowchartSvg]);

  if (loading) return <div className="loading">Loading process...</div>;
  if (error || !process) return (
    <div className="processes-page">
      <div className="error-message">{error || 'Process not found'}</div>
      <button className="btn-back" onClick={() => navigate('/processes/overview')}>Back</button>
    </div>
  );

  return (
    <div className="processes-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/processes/overview')}>
            ← Back to Processes
          </button>
          <h1>{process.name}</h1>
          <p className="subtitle">{process.description || 'No description provided'}</p>
        </div>
      </div>

      <div className="process-detail">
        <div className="info-grid">
          <div className="info-item">
            <label>Type</label>
            <span>{process.processType || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Parent</label>
            <span>{parentLabel}</span>
          </div>
          <div className="info-item">
            <label>Department</label>
            <span>{process.departmentName || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Category</label>
            <span>{process.processCategory || 'N/A'}</span>
          </div>
        </div>

        <section className="process-flowchart" style={{ marginTop: 16 }}>
          <h2>Flowchart</h2>
          {canEditFlowchart ? (
            <FlowchartEditor
              initialData={flowchartData || undefined}
              onSave={handleSaveFlowchart}
            />
          ) : flowchartData ? (
            <FlowchartViewer data={flowchartData} />
          ) : (
            <div className="no-data">No flowchart defined</div>
          )}
        </section>

        <section style={{ marginTop: 16 }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Linked Documents</h2>
            <button className="btn-add" onClick={() => setShowLinkModal(true)}>+ Link Document</button>
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
                  <th>Linked At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-data">No documents linked to this process</td>
                  </tr>
                ) : (
                  linkedDocuments.map((doc: any) => (
                    <tr key={doc.id}>
                      <td className="title-cell">{doc.title}</td>
                      <td>{doc.documentType}</td>
                      <td>{doc.category}</td>
                      <td><span className="version-badge">{doc.version}</span></td>
                      <td><span className={`status-badge status-${doc.status}`}>{doc.status}</span></td>
                      <td>{new Date(doc.linkedAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button className="btn-view" onClick={() => navigate(`/documents/${doc.id}`)}>View</button>
                        <button className="btn-delete-small" onClick={() => handleUnlinkDocument(doc.id)}>Unlink</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <h2>Link Document to Process</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Search documents by title, type, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Version</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="no-data">
                        {searchTerm ? 'No matching documents' : 'No available documents'}
                      </td>
                    </tr>
                  ) : (
                    availableDocuments.map(doc => (
                      <tr key={doc.id}>
                        <td className="title-cell">{doc.title}</td>
                        <td>{doc.documentType}</td>
                        <td><span className="version-badge">{doc.version}</span></td>
                        <td>
                          <button className="btn-edit" onClick={() => { handleLinkDocument(doc.id); setShowLinkModal(false); }}>
                            Link
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button className="btn-cancel" onClick={() => setShowLinkModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessDetail;
