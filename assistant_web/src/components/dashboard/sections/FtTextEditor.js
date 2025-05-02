import React, { useCallback, useEffect, useRef } from 'react';
import { Box, VStack, useColorModeValue } from '@chakra-ui/react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Prism as SyntaxHighlighter } from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import './FtTextEditor.css';

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

function Placeholder() {
  return (
    <div className="editor-placeholder">
      Type / for commands...
    </div>
  );
}

const ToolbarPlugin = React.memo(() => {
  const [editor] = useLexicalComposerContext();

  const handleFormat = (format) => {
    editor.update(() => {
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontWeight = format === 'bold' ? 'bold' : 'normal';
        span.style.fontStyle = format === 'italic' ? 'italic' : 'normal';
        span.style.textDecoration = format === 'underline' ? 'underline' : 'none';
        range.surroundContents(span);
      }
    });
  };

  const handleInsert = (type) => {
    editor.update(() => {
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        const node = document.createElement(type === 'list' ? 'ul' : type === 'code' ? 'pre' : 'table');
        
        if (type === 'table') {
          const tbody = document.createElement('tbody');
          for (let i = 0; i < 3; i++) {
            const tr = document.createElement('tr');
            for (let j = 0; j < 3; j++) {
              const td = document.createElement('td');
              td.textContent = '';
              tr.appendChild(td);
            }
            tbody.appendChild(tr);
          }
          node.appendChild(tbody);
        } else if (type === 'list') {
          const li = document.createElement('li');
          li.textContent = '';
          node.appendChild(li);
        } else if (type === 'code') {
          node.className = 'editor-code';
          node.textContent = '';
        }
        
        range.insertNode(node);
      }
    });
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.update(() => {
        const selection = window.getSelection();
        if (selection) {
          const range = selection.getRangeAt(0);
          const a = document.createElement('a');
          a.href = url;
          a.textContent = selection.toString() || url;
          range.surroundContents(a);
        }
      });
    }
  };

  return (
    <div className="editor-toolbar">
      <button onClick={() => handleFormat('bold')}>Bold</button>
      <button onClick={() => handleFormat('italic')}>Italic</button>
      <button onClick={() => handleFormat('underline')}>Underline</button>
      <button onClick={handleLink}>Link</button>
      <button onClick={() => handleInsert('code')}>Code</button>
      <button onClick={() => handleInsert('list')}>List</button>
      <button onClick={() => handleInsert('table')}>Table</button>
    </div>
  );
});

const CodeHighlightPlugin = React.memo(() => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(CodeNode, (node) => {
      const language = node.getLanguage();
      const code = node.getTextContent();
      const highlightedCode = SyntaxHighlighter.highlight(code, SyntaxHighlighter.languages[language], language);
      node.setHighlightedCode(highlightedCode);
    });
  }, [editor]);

  return null;
});

const ActionsPlugin = React.memo(() => {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = React.useState(true);

  return (
    <div className="editor-actions">
      <button
        onClick={() => {
          setIsEditable(!isEditable);
          editor.setEditable(!isEditable);
        }}
      >
        {isEditable ? 'Disable' : 'Enable'} Edit
      </button>
      <button
        onClick={() => {
          const editorState = editor.getEditorState();
          console.log(editorState.toJSON());
        }}
      >
        Log State
      </button>
    </div>
  );
});

const FtTextEditor = ({ currentTask, setCurrentTask }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const updateTimeoutRef = useRef(null);

  const handleChange = useCallback((editorState) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const editorStateJSON = editorState.toJSON();
      setCurrentTask(prev => ({
        ...prev,
        description: JSON.stringify(editorStateJSON),
      }));
    }, 300);
  }, [setCurrentTask]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const editorConfig = {
    namespace: 'FtTextEditor',
    onError: (error) => {
      console.error(error);
    },
    theme,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <VStack
      align="stretch"
      spacing={0}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      minH="500px"
    >
      <LexicalComposer initialConfig={editorConfig}>
        <div className="editor-container">
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<Placeholder />}
            />
            <OnChangePlugin
              onChange={handleChange}
              ignoreSelectionChange={true}
              ignoreHistoryMergeTagChange={true}
            />
            <AutoFocusPlugin />
            <ListPlugin />
            <LinkPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <CodeHighlightPlugin />
          </div>
          <ActionsPlugin />
        </div>
      </LexicalComposer>
    </VStack>
  );
};

export default FtTextEditor;
