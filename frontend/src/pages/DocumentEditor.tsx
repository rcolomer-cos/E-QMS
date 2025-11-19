import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getDocumentById,
  getDocumentContent,
  saveDocumentContent,
  updateDocument,
  uploadContentImage,
  exportDocumentPdf,
} from '../services/documentService';
import { Document } from '../types';
import PlateEditor, { PlateEditorHandle } from '../components/PlateEditor';
import '../styles/DocumentEditor.css';

const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [docMeta, setDocMeta] = useState<Document | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaFormData, setMetaFormData] = useState<Partial<Document>>({});
  const [initialContent, setInitialContent] = useState<string>('');
  const [contentLoaded, setContentLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<PlateEditorHandle>(null);
  const currentContentRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const doc = await getDocumentById(parseInt(id, 10));
        setDocMeta(doc);
        setMetaFormData({
          version: doc.version,
          status: doc.status,
          complianceRequired: doc.complianceRequired,
          effectiveDate: doc.effectiveDate,
          reviewDate: doc.reviewDate,
          expiryDate: doc.expiryDate,
        });
        const content = await getDocumentContent(parseInt(id, 10));
        if (content?.content) {
          setInitialContent(content.content);
          currentContentRef.current = content.content;
          lastSavedContentRef.current = content.content;
        } else {
          setInitialContent('');
          currentContentRef.current = '';
          lastSavedContentRef.current = '';
        }
        setContentLoaded(true);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load document');
      }
    };
    load();
  }, [id]);

  const handleContentChange = (content: string) => {
    currentContentRef.current = content;
    // Mark as unsaved if content differs from last saved
    if (content !== lastSavedContentRef.current) {
      setHasUnsavedChanges(true);
    }
  };

  // Manual save function
  const handleSave = async () => {
    if (!id || !editorRef.current || saving) return;
    try {
      setSaving(true);
      setError('');
      // Get the latest content from the editor
      const content = await editorRef.current.getContent();
      await saveDocumentContent(parseInt(id, 10), {
        content: content,
        contentFormat: 'html',
      });
      lastSavedContentRef.current = content;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleMetaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setMetaFormData({
      ...metaFormData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMetaSave = async () => {
    if (!id || saving) return;
    try {
      setSaving(true);
      setError('');
      await updateDocument(parseInt(id, 10), metaFormData);
      // Reload document to get updated data
      const doc = await getDocumentById(parseInt(id, 10));
      setDocMeta(doc);
      setEditingMeta(false);
      setLastSaved(new Date());
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update document metadata');
    } finally {
      setSaving(false);
    }
  };

  const cancelMetaEdit = () => {
    setMetaFormData({
      version: docMeta?.version,
      status: docMeta?.status,
      complianceRequired: docMeta?.complianceRequired,
      effectiveDate: docMeta?.effectiveDate,
      reviewDate: docMeta?.reviewDate,
      expiryDate: docMeta?.expiryDate,
    });
    setEditingMeta(false);
  };

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, saving]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        );
        if (!confirmLeave) {
          // Push the current state back
          window.history.pushState(null, '', window.location.href);
        }
      }
    };
    
    // Push an extra state to catch back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!id || !editorRef.current) return '';
    try {
      const { url } = await uploadContentImage(parseInt(id, 10), file);
      editorRef.current.insertImage(url);
      return url;
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to upload image');
      throw e;
    }
  };

  const handlePdfExport = async () => {
    if (!id) return;
    try {
      // Use the server-side PDF export since DevExpress Rich Edit requires server processing
      const blob = await exportDocumentPdf(parseInt(id, 10));
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docMeta?.title || 'document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to export PDF');
    }
  };

  if (!contentLoaded) return <div>Loading...</div>;

  return (
    <div className="document-editor-page">
      <div className="page-header">
        <div>
          <button 
            className="btn-back" 
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmLeave = window.confirm(
                  'You have unsaved changes. Are you sure you want to leave?'
                );
                if (!confirmLeave) return;
              }
              navigate(`/documents/${id}`);
            }}
          >
            ← Back to Document
          </button>
          <h1>Edit: {docMeta?.title || 'Document'}{hasUnsavedChanges && ' *'}</h1>
          <p className="subtitle">Version {docMeta?.version} • Status {docMeta?.status}</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saving || !hasUnsavedChanges}
            title="Save (Ctrl+S)"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn-secondary" onClick={handlePdfExport}>
            Export PDF
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Document Metadata Section */}
      <div className="document-metadata-section" style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Document Metadata</h3>
          {!editingMeta ? (
            <button className="btn-secondary" onClick={() => setEditingMeta(true)}>
              Edit Metadata
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleMetaSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Metadata'}
              </button>
              <button className="btn-secondary" onClick={cancelMetaEdit} disabled={saving}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingMeta ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Version</label>
              <div>{docMeta?.version || 'N/A'}</div>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Status</label>
              <div style={{ textTransform: 'capitalize' }}>{docMeta?.status || 'N/A'}</div>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Compliance Required</label>
              <div>{docMeta?.complianceRequired ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Effective Date</label>
              <div>{docMeta?.effectiveDate ? new Date(docMeta.effectiveDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Review Date</label>
              <div>{docMeta?.reviewDate ? new Date(docMeta.reviewDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Expiry Date</label>
              <div>{docMeta?.expiryDate ? new Date(docMeta.expiryDate).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label htmlFor="version" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Version
              </label>
              <input
                type="text"
                id="version"
                name="version"
                value={metaFormData.version || ''}
                onChange={handleMetaChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
                placeholder="1.0"
              />
            </div>
            <div>
              <label htmlFor="status" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Status
              </label>
              <select
                id="status"
                name="status"
                value={metaFormData.status || 'draft'}
                onChange={handleMetaChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
              >
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="obsolete">Obsolete</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  name="complianceRequired"
                  checked={metaFormData.complianceRequired || false}
                  onChange={handleMetaChange}
                  style={{ marginRight: '8px' }}
                />
                Compliance Required
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: '5px 0 0 0' }}>
                Mark if users must acknowledge this document
              </p>
            </div>
            <div>
              <label htmlFor="effectiveDate" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Effective Date
              </label>
              <input
                type="date"
                id="effectiveDate"
                name="effectiveDate"
                value={metaFormData.effectiveDate || ''}
                onChange={handleMetaChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
              />
            </div>
            <div>
              <label htmlFor="reviewDate" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Review Date
              </label>
              <input
                type="date"
                id="reviewDate"
                name="reviewDate"
                value={metaFormData.reviewDate || ''}
                onChange={handleMetaChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
              />
            </div>
            <div>
              <label htmlFor="expiryDate" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={metaFormData.expiryDate || ''}
                onChange={handleMetaChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="editor-container">
        <PlateEditor
          ref={editorRef}
          initialContent={initialContent}
          onContentChange={handleContentChange}
          readOnly={false}
          onImageUpload={handleImageUpload}
        />
      </div>

      <div className="editor-status">
        {saving ? 'Saving…' : hasUnsavedChanges ? 'Unsaved changes' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'No changes'}
      </div>
    </div>
  );
};

export default DocumentEditor;
