import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getDocumentById,
  getDocumentContent,
  saveDocumentContent,
  uploadContentImage,
  exportDocumentPdf,
} from '../services/documentService';
import { Document } from '../types';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import '../styles/DocumentEditor.css';

const AUTOSAVE_MS = 5000;

const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [docMeta, setDocMeta] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
      }),
      Link.configure({ openOnClick: true }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
    ],
    onUpdate: () => {
      // handled by autosave interval
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const doc = await getDocumentById(parseInt(id, 10));
        setDocMeta(doc);
        const content = await getDocumentContent(parseInt(id, 10));
        if (content?.content) {
          // We default to ProseMirror JSON; if html, set as HTML
          try {
            const json = JSON.parse(content.content);
            editor?.commands.setContent(json);
          } catch {
            editor?.commands.setContent(content.content);
          }
        } else {
          editor?.commands.setContent('');
        }
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load document');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!editor || !id) return;
      try {
        setSaving(true);
        const json = editor.getJSON();
        await saveDocumentContent(parseInt(id, 10), {
          content: JSON.stringify(json),
          contentFormat: 'prosemirror',
        });
        setLastSaved(new Date());
      } catch (e: any) {
        // surface minimal error but don't block
        console.error('Autosave failed', e);
      } finally {
        setSaving(false);
      }
    }, AUTOSAVE_MS);
    return () => clearInterval(interval);
  }, [editor, id]);

  const addImage = async (file: File) => {
    if (!id || !editor) return;
    const { url } = await uploadContentImage(parseInt(id, 10), file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  const handlePdfExport = async () => {
    if (!id) return;
    try {
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

  if (!editor) return null;

  return (
    <div className="document-editor-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate(`/documents/${id}`)}>
            ← Back to Document
          </button>
          <h1>Edit: {docMeta?.title || 'Document'}</h1>
          <p className="subtitle">Version {docMeta?.version} • Status {docMeta?.status}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handlePdfExport}>
            Export PDF (watermarked)
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="editor-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>I</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
        <button onClick={() => editor.chain().focus().setParagraph().run()}>P</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
        <label className="image-upload">
          <input type="file" accept="image/*" onChange={(e) => e.target.files && addImage(e.target.files[0])} style={{ display: 'none' }} />
          <span>Image</span>
        </label>
      </div>

      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>

      <div className="editor-status">
        {saving ? 'Saving…' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Idle'}
      </div>
    </div>
  );
};

export default DocumentEditor;
