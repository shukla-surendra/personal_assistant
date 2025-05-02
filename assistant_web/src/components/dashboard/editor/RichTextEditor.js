import React, { useCallback, useRef, useEffect } from 'react';
import './RichTextEditor.css';

export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleFormat = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const handleInsert = useCallback((type) => {
    switch (type) {
      case 'list':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'code':
        const codeBlock = document.createElement('pre');
        codeBlock.className = 'editor-code';
        codeBlock.textContent = '// Add your code here';
        document.execCommand('insertHTML', false, codeBlock.outerHTML);
        break;
      case 'table':
        const table = `
          <table class="editor-table">
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
              <td>Cell 3</td>
            </tr>
            <tr>
              <td>Cell 4</td>
              <td>Cell 5</td>
              <td>Cell 6</td>
            </tr>
          </table>
        `;
        document.execCommand('insertHTML', false, table);
        break;
    }
    handleInput();
  }, [handleInput]);

  const handleLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      handleInput();
    }
  }, [handleInput]);

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button onClick={() => handleFormat('bold')}>Bold</button>
        <button onClick={() => handleFormat('italic')}>Italic</button>
        <button onClick={() => handleFormat('underline')}>Underline</button>
        <button onClick={handleLink}>Link</button>
        <button onClick={() => handleInsert('code')}>Code</button>
        <button onClick={() => handleInsert('list')}>List</button>
        <button onClick={() => handleInsert('table')}>Table</button>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    </div>
  );
} 