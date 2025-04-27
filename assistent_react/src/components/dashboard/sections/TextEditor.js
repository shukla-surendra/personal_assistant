import React, { useMemo, useState, useCallback } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor } from 'slate';

function TextEditor({ currentTask, setCurrentTask }) {
  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: currentTask.description || 'Enter Text Here' }],
    },
  ]);

  const editor = useMemo(() => withReact(createEditor()), []);

  const onChange = useCallback((newValue) => {
    setValue(newValue);
    console.log(newValue)
    // setCurrentTask({ ...currentTask, description: newValue.children[0].text });
  }, []);

  return (
    <div onClick={(e) => editor.focus()}>
      <Slate editor={editor} value={value} onChange={onChange}>
        <Editable />
      </Slate>
    </div>
  );
}

export default TextEditor;
