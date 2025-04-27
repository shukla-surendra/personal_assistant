import React, { useState } from 'react';
import { Box, VStack, HStack, IconButton, useColorModeValue, Icon, Menu, MenuButton, MenuList, MenuItem, Divider } from '@chakra-ui/react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiCode,
  FiCheckSquare,
  FiTable,
  FiType,
  FiMinus,
  FiPlus,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiImage,
  FiFileText,
  FiColumns,
  FiToggleLeft,
  FiToggleRight,
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
import './FtTextEditor.css';

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
};

const MenuBar = ({ editor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  if (!editor) {
    return null;
  }

  const handleFormat = (format) => {
    editor.dispatchCommand('FORMAT_TEXT', { format });
  };

  const handleHeading = (level) => {
    editor.dispatchCommand('FORMAT_TEXT', { format: 'heading', level });
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
          </MenuList>
        </Menu>

        {/* Lists */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiList} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_UNORDERED_LIST')}>Bullet List</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_ORDERED_LIST')}>Numbered List</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_CHECK_LIST')}>Check List</MenuItem>
          </MenuList>
        </Menu>

        {/* Alignment */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiAlignLeft} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => handleFormat('left')}>Align Left</MenuItem>
            <MenuItem onClick={() => handleFormat('center')}>Align Center</MenuItem>
            <MenuItem onClick={() => handleFormat('right')}>Align Right</MenuItem>
          </MenuList>
        </Menu>

        {/* Special Blocks */}
        <Menu>
          <MenuButton as={IconButton} size="sm" icon={<Icon as={FiPlus} />} variant="ghost" />
          <MenuList>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_QUOTE')}>Quote</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_CODE')}>Code Block</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_TABLE')}>Table</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_IMAGE')}>Image</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_COLUMNS')}>Columns</MenuItem>
            <MenuItem onClick={() => editor.dispatchCommand('INSERT_TOGGLE')}>Toggle</MenuItem>
          </MenuList>
        </Menu>

        {/* Quick Actions */}
        <IconButton
          size="sm"
          icon={<Icon as={FiLink} />}
          onClick={() => editor.dispatchCommand('INSERT_LINK')}
          variant="ghost"
        />
        <IconButton
          size="sm"
          icon={<Icon as={FiCode} />}
          onClick={() => editor.dispatchCommand('INSERT_CODE')}
          variant="ghost"
        />
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
    ],
    onInit: (editor) => {
      if (currentTask?.description) {
        try {
          const parsedState = JSON.parse(currentTask.description);
          editor.setEditorState(editor.parseEditorState(parsedState));
        } catch (e) {
          console.error('Error parsing editor state:', e);
          editor.update(() => {
            const root = $getRoot();
            const paragraph = $createParagraphNode();
            const text = $createTextNode(currentTask.description || '');
            paragraph.append(text);
            root.append(paragraph);
          });
        }
      } else {
        editor.update(() => {
          const root = $getRoot();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        });
      }
    },
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
        </Box>
      </LexicalComposer>
    </VStack>
  );
};

export default FtTextEditor;
