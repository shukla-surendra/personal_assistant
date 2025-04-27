import React, { useState, useCallback, useEffect } from 'react';
import { Box, VStack, HStack, IconButton, useColorModeValue, Icon, Menu, MenuButton, MenuList, MenuItem, Divider, Tooltip, Select, useToast } from '@chakra-ui/react';
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

const MenuBar = ({ editor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const toast = useToast();

  if (!editor) {
    return null;
  }

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

  const handleCodeLanguageChange = (language) => {
    editor.dispatchCommand('UPDATE_CODE_LANGUAGE', { language });
    toast({
      title: "Code Block",
      description: `Language set to ${language}`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <VStack align="stretch" spacing={0}>
      <HStack spacing={1} p={2} borderBottomWidth="1px" borderColor={borderColor} bg={bgColor}>
        {/* Text Formatting */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiType} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => handleHeading(1)}>Heading 1</MenuItem>
            <MenuItem onClick={() => handleHeading(2)}>Heading 2</MenuItem>
            <MenuItem onClick={() => handleHeading(3)}>Heading 3</MenuItem>
            <Divider />
            <MenuItem onClick={() => handleFormat('bold')}>Bold</MenuItem>
            <MenuItem onClick={() => handleFormat('italic')}>Italic</MenuItem>
            <MenuItem onClick={() => handleFormat('underline')}>Underline</MenuItem>
            <MenuItem onClick={() => handleFormat('strikethrough')}>Strikethrough</MenuItem>
            <MenuItem onClick={() => handleFormat('subscript')}>Subscript</MenuItem>
            <MenuItem onClick={() => handleFormat('superscript')}>Superscript</MenuItem>
          </MenuList>
        </Menu>

        {/* Lists */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiList} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_UNORDERED_LIST')}>Bullet List</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_ORDERED_LIST')}>Numbered List</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_CHECK_LIST')}>Check List</MenuItem>
            <Divider />
            <MenuItem onClick={() => editor.dispatchCommand('INDENT_LIST')}>Indent</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('OUTDENT_LIST')}>Outdent</MenuItem>
          </MenuList>
        </Menu>

        {/* Code Block */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiCode} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => handleInsert('code')}>Insert Code Block</MenuItem>
            <Divider />
            <MenuItem onClick={() => handleCodeLanguageChange('javascript')}>JavaScript</MenuItem>
            <MenuItem onClick={() => handleCodeLanguageChange('python')}>Python</MenuItem>
            <MenuItem onClick={() => handleCodeLanguageChange('java')}>Java</MenuItem>
            <MenuItem onClick={() => handleCodeLanguageChange('css')}>CSS</MenuItem>
          </MenuList>
        </Menu>

        {/* Alignment */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiAlignLeft} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => handleFormat('left')}>Align Left</MenuItem>
            <MenuItem onClick={() => handleFormat('center')}>Align Center</MenuItem>
            <MenuItem onClick={() => handleFormat('right')}>Align Right</MenuItem>
            <MenuItem onClick={() => handleFormat('justify')}>Justify</MenuItem>
          </MenuList>
        </Menu>

        {/* Special Blocks */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiPlus} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_QUOTE')}>Quote</MenuItem>
            <MenuItem onClick={() => handleInsert('table')}>Table</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_COLUMNS')}>Columns</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_TOGGLE')}>Toggle</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_HORIZONTAL_RULE')}>Divider</MenuItem>
          </MenuList>
        </Menu>

        {/* Quick Actions */}
        <Tooltip label="Link">
          <IconButton
            size="sm"
            icon={<Icon as={FiLink} />}
            onClick={() => editor.dispatchCommand('INSERT_LINK')}
            variant="ghost"
          />
        </Tooltip>
        <Tooltip label="Tags">
          <IconButton
            size="sm"
            icon={<Icon as={FiHash} />}
            onClick={() => editor.dispatchCommand('INSERT_HASHTAG')}
            variant="ghost"
          />
        </Tooltip>
        <Tooltip label="Quote">
          <IconButton
            size="sm"
            icon={<Icon as={FiMessageSquare} />}
            onClick={() => editor.dispatchCommand('INSERT_QUOTE')}
            variant="ghost"
          />
        </Tooltip>
      </HStack>
    </VStack>
  );
};

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
        <MenuBar />
        <Box p={4} className="lexical-editor">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Type / for commands...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin
            onChange={(editorState) => {
              const editorStateJSON = editorState.toJSON();
              setCurrentTask({
                ...currentTask,
                description: JSON.stringify(editorStateJSON),
              });
            }}
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
          <EditorContentLoader currentTask={currentTask} />
        </Box>
      </LexicalComposer>
    </VStack>
  );
};

// Separate component to handle content loading
const EditorContentLoader = ({ currentTask }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (currentTask?.description) {
      try {
        const parsedState = JSON.parse(currentTask.description);
        editor.setEditorState(editor.parseEditorState(parsedState));
      } catch (error) {
        console.error('Error parsing editor state:', error);
      }
    }
  }, [currentTask?.description, editor]);

  return null;
};

const CodeHighlightPlugin = () => {
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
};

export default FtTextEditor;
