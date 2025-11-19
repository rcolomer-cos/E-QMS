import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { create, createOptions, ViewType, DocumentFormat } from 'devexpress-richedit';
import type { RichEdit } from 'devexpress-richedit';
import 'devextreme/dist/css/dx.light.css';
import 'devexpress-richedit/dist/dx.richedit.css';

interface DevExpressRichEditorProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  readOnly?: boolean;
}

export interface DevExpressRichEditorHandle {
  getContent: () => Promise<string>;
  insertImage: (imageUrl: string) => void;
  exportToPdf: () => Promise<Blob>;
}

const DevExpressRichEditor = forwardRef<DevExpressRichEditorHandle, DevExpressRichEditorProps>(({ 
  onContentChange, 
  initialContent = '', 
  readOnly = false 
}, ref) => {
  const richEditRef = useRef<HTMLDivElement>(null);
  const richEditInstanceRef = useRef<RichEdit | null>(null);
  const contentLoadedRef = useRef(false);
  const onContentChangeRef = useRef(onContentChange);
  const htmlContentRef = useRef<string>('');

  // Keep the callback ref up to date without causing re-renders
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // Initialize the editor only once
  useEffect(() => {
    // Ensure the ref is attached and we haven't already created an instance
    if (!richEditRef.current || richEditInstanceRef.current) return;

    // Small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      // Double-check the instance hasn't been created during the timeout
      if (!richEditRef.current || richEditInstanceRef.current) return;

      // Create Rich Edit instance with options
      const options = createOptions();
      
      // Configure options safely
      if (options.bookmarks) {
        options.bookmarks.visibility = true;
        options.bookmarks.color = '#ff0000';
      }
      
      if (options.confirmOnLosingChanges) {
        options.confirmOnLosingChanges.enabled = false; // Disable to avoid modal during autosave
      }
      
      if (options.fields) {
        options.fields.updateFieldsBeforePrint = true;
        options.fields.updateFieldsOnPaste = true;
      }
      
      options.readOnly = readOnly;
      // Set explicit dimensions to ensure proper display
      options.width = '100%';
      options.height = '100%';
      
      if (options.view) {
        options.view.viewType = ViewType.PrintLayout;
        if (options.view.simpleViewSettings) {
          options.view.simpleViewSettings.paddings = {
            left: 15,
            top: 15,
            right: 15,
            bottom: 15,
          };
        }
      }

      // Set up content change event handler using ref
      if (options.events) {
        let changeTimeout: NodeJS.Timeout;
        const handleChange = () => {
          clearTimeout(changeTimeout);
          changeTimeout = setTimeout(() => {
            if (richEditInstanceRef.current && onContentChangeRef.current) {
              // Get plain text content for change detection
              const text = richEditInstanceRef.current.document.getText();
              onContentChangeRef.current(text);
            }
          }, 1000);
        };
        options.events.contentInserted = handleChange;
        options.events.contentRemoved = handleChange;
      }

      // Create the Rich Edit control
      const richEdit = create(richEditRef.current, options);
      richEditInstanceRef.current = richEdit;

      // Load initial content if provided
      if (initialContent && !contentLoadedRef.current) {
        try {
          // Store the HTML content for later retrieval
          htmlContentRef.current = initialContent;
          // Load as HTML to preserve images and formatting
          richEdit.openDocument(initialContent, 'Document', DocumentFormat.Html);
          contentLoadedRef.current = true;
        } catch (err) {
          console.error('Failed to load HTML content:', err);
          // Fallback: try as plain text
          try {
            richEdit.document.insertText(0, initialContent);
            htmlContentRef.current = initialContent; // Store plain text too
            contentLoadedRef.current = true;
          } catch (textErr) {
            console.error('Failed to insert text:', textErr);
          }
        }
      }
    }, 100); // 100ms delay for DOM to be ready

    // Cleanup only on unmount
    return () => {
      clearTimeout(timeoutId);
      if (richEditInstanceRef.current) {
        richEditInstanceRef.current.dispose();
        richEditInstanceRef.current = null;
      }
      contentLoadedRef.current = false;
    };
  }, []); // Empty deps - only run once on mount

  // Update content when initialContent changes
  useEffect(() => {
    if (richEditInstanceRef.current && initialContent && !contentLoadedRef.current) {
      try {
        // Store the HTML content
        htmlContentRef.current = initialContent;
        richEditInstanceRef.current.openDocument(initialContent, 'Document', DocumentFormat.Html);
        contentLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load HTML content:', err);
        // Fallback: try as plain text
        try {
          richEditInstanceRef.current.document.insertText(0, initialContent);
          htmlContentRef.current = initialContent;
          contentLoadedRef.current = true;
        } catch (textErr) {
          console.error('Failed to insert text:', textErr);
        }
      }
    }
  }, [initialContent]);

  const getContent = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!richEditInstanceRef.current) {
        resolve('');
        return;
      }

      try {
        // Try to access the editor's internal DOM to extract HTML
        if (richEditRef.current) {
          // Find the content editable area within the DevExpress editor
          const contentArea = richEditRef.current.querySelector('[contenteditable="true"]') as HTMLElement;
          if (contentArea && contentArea.innerHTML) {
            const html = contentArea.innerHTML;
            htmlContentRef.current = html;
            resolve(html);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to extract HTML from DOM:', err);
      }

      // Fallback: Return the initially loaded HTML or plain text
      if (htmlContentRef.current) {
        resolve(htmlContentRef.current);
      } else {
        const text = richEditInstanceRef.current.document.getText();
        resolve(text);
      }
    });
  }, []);

  const insertImage = useCallback((imageUrl: string) => {
    if (richEditInstanceRef.current) {
      const richEdit = richEditInstanceRef.current;
      const position = richEdit.selection.active;
      richEdit.document.insertPicture(position, imageUrl);
    }
  }, []);

  const exportToPdf = useCallback((): Promise<Blob> => {
    return new Promise((_, reject) => {
      // PDF export with DevExpress Rich Edit requires server-side processing
      // For now, we'll use the existing backend exportDocumentPdf endpoint
      reject(new Error('Use server-side PDF export endpoint instead'));
    });
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContent,
    insertImage,
    exportToPdf
  }), [getContent, insertImage, exportToPdf]);

  return (
    <div 
      ref={richEditRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative'
      }} 
    />
  );
});

DevExpressRichEditor.displayName = 'DevExpressRichEditor';

export default DevExpressRichEditor;
