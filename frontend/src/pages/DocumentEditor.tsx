import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getDocumentById,
  getDocumentContent,
  saveDocumentContent,
  uploadContentImage,
  exportDocumentPdf,
} from '../services/documentService';
import { Document } from '../types';
import DevExpressHtmlEditor, { DevExpressHtmlEditorHandle } from '../components/DevExpressHtmlEditor';
import '../styles/DocumentEditor.css';

const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [docMeta, setDocMeta] = useState<Document | null>(null);
  const [initialContent, setInitialContent] = useState<string>('');
  const [contentLoaded, setContentLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<DevExpressHtmlEditorHandle>(null);
  const currentContentRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const doc = await getDocumentById(parseInt(id, 10));
        setDocMeta(doc);
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
    
    const handlePopState = (e: PopStateEvent) => {
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

  const handleImageUpload = async (file: File) => {
    if (!id || !editorRef.current) return;
    try {
      const { url } = await uploadContentImage(parseInt(id, 10), file);
      editorRef.current.insertImage(url);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to upload image');
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
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} 
              style={{ display: 'none' }} 
            />
            Insert Image
          </label>
          <button className="btn-secondary" onClick={handlePdfExport}>
            Export PDF
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="editor-container">
        <DevExpressHtmlEditor
          ref={editorRef}
          initialContent={initialContent}
          onContentChange={handleContentChange}
          readOnly={false}
        />
      </div>

      <div className="editor-status">
        {saving ? 'Saving…' : hasUnsavedChanges ? 'Unsaved changes' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'No changes'}
      </div>
    </div>
  );
};

export default DocumentEditor;
