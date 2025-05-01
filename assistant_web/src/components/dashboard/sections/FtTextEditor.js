import React, { useCallback, useEffect, useRef } from 'react';
import { Box, VStack, HStack, IconButton, useColorModeValue, Icon, Tooltip } from '@chakra-ui/react';
import {
  FiBold, FiItalic, FiUnderline, FiList, FiLink, FiCheckSquare,
  FiTable, FiType, FiMinus, FiPlus, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiImage, FiFileText, FiColumns, FiToggleLeft, FiToggleRight, FiMaximize,
  FiMinimize, FiSearch, FiBookmark, FiTag, FiHash, FiCalendar, FiIndent,
  FiOutdent, FiSubscript, FiSuperscript, FiText, FiMessageSquare, FiCode
} from 'react-icons/fi';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HashtagNode } from '@lexical/hashtag';
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

const Toolbar = React.memo(({ editor }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');

  if (!editor) return null;

  const handleFormat = (format) => {
    editor.dispatchCommand('FORMAT_TEXT', { format });
  };

  const handleHeading = (level) => {
    editor.dispatchCommand('FORMAT_TEXT', { format: 'heading', level });
  };

  const handleInsert = (type) => {
    switch (type) {
      case 'table':
        editor.dispatchCommand('INSERT_TABLE', { rows: 3, columns: 3 });
        break;
      case 'code':
        editor.dispatchCommand('INSERT_CODE', { language: 'javascript' });
        break;
      default:
        break;
    }
  };

  return (
    <HStack
      spacing={1}
      p={2}
      borderBottom="1px"
      borderColor={borderColor}
      bg={bgColor}
    >
      <Tooltip label="Bold">
        <IconButton
          size="sm"
          icon={<Icon as={FiBold} />}
          onClick={() => handleFormat('bold')}
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="Italic">
        <IconButton
          size="sm"
          icon={<Icon as={FiItalic} />}
          onClick={() => handleFormat('italic')}
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="Underline">
        <IconButton
          size="sm"
          icon={<Icon as={FiUnderline} />}
          onClick={() => handleFormat('underline')}
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="Link">
        <IconButton
          size="sm"
          icon={<Icon as={FiLink} />}
          onClick={() => editor.dispatchCommand('INSERT_LINK')}
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="Code">
        <IconButton
          size="sm"
          icon={<Icon as={FiCode} />}
          onClick={() => handleInsert('code')}
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="List">
        <IconButton
          size="sm"
          icon={<Icon as={FiList} />}
          onClick={() => editor.dispatchCommand('INSERT_UNORDERED_LIST')}
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="Table">
        <IconButton
          size="sm"
          icon={<Icon as={FiTable} />}
          onClick={() => handleInsert('table')}
          variant="ghost"
        />
      </Tooltip>
    </HStack>
  );
});

const FtTextEditor = ({ currentTask, setCurrentTask }) => {
  const initialConfig = {
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
      HorizontalRuleNode,
      HashtagNode,
    ],
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const updateTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

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
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <Box p={4} className="lexical-editor">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Type / for commands...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin
            onChange={handleChange}
            ignoreSelectionChange={true}
            ignoreHistoryMergeTagChange={true}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <TablePlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <HorizontalRulePlugin />
          <HashtagPlugin />
          <CodeHighlightPlugin />
          <EditorContentLoader currentTask={currentTask} isInitialMount={isInitialMount} />
        </Box>
      </LexicalComposer>
    </VStack>
  );
};

const EditorContentLoader = React.memo(({ currentTask, isInitialMount }) => {
  const [editor] = useLexicalComposerContext();
  const lastContentRef = useRef(null);

  useEffect(() => {
    if (currentTask?.description && 
        (currentTask.description !== lastContentRef.current || isInitialMount.current)) {
      try {
        const parsedState = JSON.parse(currentTask.description);
        editor.setEditorState(editor.parseEditorState(parsedState));
        lastContentRef.current = currentTask.description;
        isInitialMount.current = false;
      } catch (error) {
        console.error('Error parsing editor state:', error);
      }
    }
  }, [currentTask?.description, editor, isInitialMount]);

  return null;
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

export default React.memo(FtTextEditor);
