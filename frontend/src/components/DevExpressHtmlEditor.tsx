import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import HtmlEditor, { Toolbar, Item } from 'devextreme-react/html-editor';
import 'devextreme/dist/css/dx.light.css';

interface DevExpressHtmlEditorProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
  readOnly?: boolean;
}

export interface DevExpressHtmlEditorHandle {
  getContent: () => Promise<string>;
  insertImage: (imageUrl: string) => void;
}

const DevExpressHtmlEditor = forwardRef<DevExpressHtmlEditorHandle, DevExpressHtmlEditorProps>(({ 
  onContentChange, 
  initialContent = '', 
  readOnly = false 
}, ref) => {
  const editorRef = useRef<any>(null);

  const handleValueChanged = useCallback((e: any) => {
    if (onContentChange && e.value !== undefined) {
      onContentChange(e.value);
    }
  }, [onContentChange]);

  const getContent = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (editorRef.current) {
        const instance = editorRef.current.instance;
        // Get HTML content using the option method
        const htmlContent = instance.option('value') as string;
        resolve(htmlContent || '');
      } else {
        resolve('');
      }
    });
  }, []);

  const insertImage = useCallback((imageUrl: string) => {
    if (editorRef.current) {
      const instance = editorRef.current.instance;
      const quillInstance = instance.getQuillInstance();
      if (quillInstance) {
        // Get current selection or insert at end
        const selection = quillInstance.getSelection();
        const index = selection ? selection.index : quillInstance.getLength();
        // Insert image using Quill's insertEmbed
        quillInstance.insertEmbed(index, 'image', imageUrl, 'user');
      }
    }
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContent,
    insertImage
  }), [getContent, insertImage]);

  return (
    <HtmlEditor
      ref={editorRef}
      defaultValue={initialContent}
      onValueChanged={handleValueChanged}
      readOnly={readOnly}
      height="100%"
    >
      <Toolbar>
        <Item name="undo" />
        <Item name="redo" />
        <Item name="separator" />
        <Item name="bold" />
        <Item name="italic" />
        <Item name="underline" />
        <Item name="strike" />
        <Item name="separator" />
        <Item name="alignLeft" />
        <Item name="alignCenter" />
        <Item name="alignRight" />
        <Item name="alignJustify" />
        <Item name="separator" />
        <Item name="orderedList" />
        <Item name="bulletList" />
        <Item name="separator" />
        <Item name="header" 
          acceptedValues={[false, 1, 2, 3, 4, 5]}
        />
        <Item name="separator" />
        <Item name="color" />
        <Item name="background" />
        <Item name="separator" />
        <Item name="link" />
        <Item name="image" />
        <Item name="separator" />
        <Item name="clear" />
        <Item name="codeBlock" />
        <Item name="blockquote" />
      </Toolbar>
    </HtmlEditor>
  );
});

DevExpressHtmlEditor.displayName = 'DevExpressHtmlEditor';

export default DevExpressHtmlEditor;
