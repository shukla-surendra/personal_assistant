import React, { useEffect } from "react";
import { Box, VStack, HStack, IconButton, useColorModeValue, Icon, Divider } from "@chakra-ui/react";
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
import { useDispatch } from "react-redux";
import { createNotes } from "../../../slices/tasks";
import TaskDataService from "../../../services/taskservice";
import './FtTextEditor.css';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
};

const MenuBar = ({ editor }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const buttonColor = useColorModeValue('gray.600', 'gray.300');
  const buttonHoverColor = useColorModeValue('brand.600', 'brand.300');
  const buttonBgHover = useColorModeValue('gray.100', 'gray.700');

  if (!editor) {
    return null;
  }

  return (
    <VStack align="stretch" spacing={0}>
      <HStack spacing={1} p={2} borderBottomWidth="1px" borderColor={borderColor} flexWrap="wrap">
        {/* Text Formatting */}
        <HStack spacing={1}>
          <IconButton
            size="sm"
            icon={<Icon as={FiBold} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'bold' })}
            variant="ghost"
            aria-label="Bold"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiItalic} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'italic' })}
            variant="ghost"
            aria-label="Italic"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiUnderline} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'underline' })}
            variant="ghost"
            aria-label="Underline"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
        </HStack>
        <Divider orientation="vertical" h="20px" borderColor={borderColor} />
        
        {/* Headings */}
        <HStack spacing={1}>
          <IconButton
            size="sm"
            icon={<Icon as={FiType} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'heading', level: 1 })}
            variant="ghost"
            aria-label="Heading 1"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiType} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'heading', level: 2 })}
            variant="ghost"
            aria-label="Heading 2"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiType} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'heading', level: 3 })}
            variant="ghost"
            aria-label="Heading 3"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
        </HStack>
        <Divider orientation="vertical" h="20px" borderColor={borderColor} />
        
        {/* Lists */}
        <HStack spacing={1}>
          <IconButton
            size="sm"
            icon={<Icon as={FiList} />}
            onClick={() => editor.dispatchCommand('INSERT_UNORDERED_LIST')}
            variant="ghost"
            aria-label="Bullet List"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiList} />}
            onClick={() => editor.dispatchCommand('INSERT_ORDERED_LIST')}
            variant="ghost"
            aria-label="Numbered List"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiCheckSquare} />}
            onClick={() => editor.dispatchCommand('INSERT_CHECK_LIST')}
            variant="ghost"
            aria-label="Check List"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
        </HStack>
        <Divider orientation="vertical" h="20px" borderColor={borderColor} />
        
        {/* Alignment */}
        <HStack spacing={1}>
          <IconButton
            size="sm"
            icon={<Icon as={FiAlignLeft} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'align-left' })}
            variant="ghost"
            aria-label="Align Left"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiAlignCenter} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'align-center' })}
            variant="ghost"
            aria-label="Align Center"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiAlignRight} />}
            onClick={() => editor.dispatchCommand('FORMAT_TEXT', { format: 'align-right' })}
            variant="ghost"
            aria-label="Align Right"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
        </HStack>
        <Divider orientation="vertical" h="20px" borderColor={borderColor} />
        
        {/* Special Blocks */}
        <HStack spacing={1}>
          <IconButton
            size="sm"
            icon={<Icon as={FiCode} />}
            onClick={() => editor.dispatchCommand('INSERT_CODE')}
            variant="ghost"
            aria-label="Code Block"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiLink} />}
            onClick={() => editor.dispatchCommand('INSERT_LINK')}
            variant="ghost"
            aria-label="Link"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
        </HStack>
        <Divider orientation="vertical" h="20px" borderColor={borderColor} />
        
        {/* Table Controls */}
        <HStack spacing={1}>
          <IconButton
            size="sm"
            icon={<Icon as={FiTable} />}
            onClick={() => editor.dispatchCommand('INSERT_TABLE')}
            variant="ghost"
            aria-label="Insert Table"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiPlus} />}
            onClick={() => editor.dispatchCommand('ADD_ROW')}
            variant="ghost"
            aria-label="Add Row"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
          <IconButton
            size="sm"
            icon={<Icon as={FiMinus} />}
            onClick={() => editor.dispatchCommand('DELETE_ROW')}
            variant="ghost"
            aria-label="Delete Row"
            color={buttonColor}
            _hover={{ color: buttonHoverColor, bg: buttonBgHover }}
          />
        </HStack>
      </HStack>
    </VStack>
  );
};

const FtQuickNoteEditor = ({ quickText, setQuickText }) => {
  const dispatch = useDispatch();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');

  const initialConfig = {
    namespace: 'FtQuickNoteEditor',
    onError: (error) => {
      console.error(error);
    },
    theme: {
      ...theme,
      text: textColor,
      placeholder: placeholderColor,
    },
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
      if (quickText.description) {
        try {
          const parsedState = JSON.parse(quickText.description);
          editor.setEditorState(editor.parseEditorState(parsedState));
        } catch (e) {
          console.error('Error parsing editor state:', e);
          editor.update(() => {
            const root = $getRoot();
            const paragraph = $createParagraphNode();
            const text = $createTextNode(quickText.description || '');
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

  const addNewQuickText = () => {
    const { title, description, priority, task_type } = quickText;
    dispatch(createNotes({ title, description, priority, task_type }))
      .unwrap()
      .then(data => {
        setQuickText(data);
      })
      .catch(e => {
        console.log(e);
      });
  };

  const getQuickText = () => {
    TaskDataService.getAllQuickNotes()
      .then(response => {
        if (response.data.length > 0) {
          setQuickText(response.data[0]);
        } else {
          addNewQuickText();
        }
      })
      .catch(e => {
        console.log(e);
      });
  };

  useEffect(() => {
    if (!quickText.task_id) {
      getQuickText();
    }
  }, [quickText.task_id]);

  return (
    <VStack
      align="stretch"
      spacing={0}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <MenuBar />
        <Box p={4} className="lexical-editor">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-input"
                style={{ 
                  color: textColor,
                  minHeight: '200px',
                  outline: 'none',
                }}
              />
            }
            placeholder={
              <div 
                className="editor-placeholder"
                style={{ color: placeholderColor }}
              >
                Type / for commands...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin
            onChange={(editorState) => {
              const editorStateJSON = editorState.toJSON();
              setQuickText({
                ...quickText,
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

export default FtQuickNoteEditor;