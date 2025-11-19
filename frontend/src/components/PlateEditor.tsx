import { forwardRef, useCallback, useImperativeHandle, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import '../styles/TipTapEditor.css';

interface PlateEditorProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  readOnly?: boolean;
  onImageUpload?: (file: File) => Promise<string>; // returns URL
}

export interface PlateEditorHandle {
  getContent: () => Promise<string>;
  getMarkdown: () => Promise<string>;
  insertImage: (imageUrl: string) => void;
}

const PlateEditor = forwardRef<PlateEditorHandle, PlateEditorProps>(({ 
  onContentChange, 
  initialContent = '', 
  readOnly = false,
  onImageUpload
}, ref) => {
  // Create TipTap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: initialContent || '<p></p>',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        const html = editor.getHTML();
        onContentChange(html);
      }
    },
  });

  // Update content when initialContent changes
  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Get content as HTML
  const getContent = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      resolve(editor ? editor.getHTML() : '');
    });
  }, [editor]);

  // Get content as Markdown (basic conversion)
  const getMarkdown = useCallback(async (): Promise<string> => {
    if (!editor) return '';
    try {
      // Dynamic import so dependency only loaded when needed
      const TurndownModule = await import('turndown');
      const turndownService = new TurndownModule.default({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });
      return turndownService.turndown(editor.getHTML());
    } catch (e) {
      console.error('Markdown conversion failed:', e);
      return '';
    }
  }, [editor]);

  // Insert image at current cursor position
  const insertImage = useCallback((imageUrl: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  }, [editor]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContent,
    getMarkdown,
    insertImage
  }), [getContent, getMarkdown, insertImage]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="tiptap-editor-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div className="tiptap-toolbar" style={{
        borderBottom: '1px solid #e0e0e0',
        padding: '8px',
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        backgroundColor: '#f5f5f5'
      }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('bold') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('italic') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('underline') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('strike') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            textDecoration: 'line-through'
          }}
        >
          S
        </button>
        <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
        {/* Image upload button */}
        <label
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📷 Image
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              if (!editor) return;
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                let url: string;
                if (onImageUpload) {
                  url = await onImageUpload(file);
                } else {
                  // Fallback: create object URL (not persisted)
                  url = URL.createObjectURL(file);
                }
                editor.chain().focus().setImage({ src: url }).run();
              } catch (err) {
                console.error('Image upload failed:', err);
              } finally {
                e.target.value = '';
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('heading', { level: 1 }) ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('heading', { level: 2 }) ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('heading', { level: 3 }) ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          H3
        </button>
        <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('bulletList') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('orderedList') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          1. List
        </button>
        <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('blockquote') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          " Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: editor.isActive('codeBlock') ? '#ddd' : '#fff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace'
          }}
        >
          {'</>'}
        </button>
        <div style={{ width: '1px', background: '#ddd', margin: '0 4px' }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ↷ Redo
        </button>
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <EditorContent 
          editor={editor}
          onPaste={async (e) => {
            if (!onImageUpload || !editor) return;
            const items = e.clipboardData?.items;
            if (items) {
              for (const item of items) {
                if (item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) {
                    e.preventDefault();
                    try {
                      const url = await onImageUpload(file);
                      editor.chain().focus().setImage({ src: url }).run();
                    } catch (err) {
                      console.error('Paste image upload failed:', err);
                    }
                  }
                }
              }
            }
          }}
          style={{
            minHeight: '100%',
            padding: '16px'
          }}
        />
      </div>
    </div>
  );
});

PlateEditor.displayName = 'PlateEditor';

export default PlateEditor;
