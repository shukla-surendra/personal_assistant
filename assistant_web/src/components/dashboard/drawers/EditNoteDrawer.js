import React, { useState, useEffect } from "react";
import {
  Flex, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Box, Button, FormControl,
  Input, Menu, MenuButton, MenuItem, MenuList, Icon, Text, useColorModeValue,
  Badge, Tooltip, useToast, IconButton, VStack, HStack, Divider, Tag,
  TagLabel, TagCloseButton, Wrap, Select, InputGroup, InputLeftElement,
  InputRightElement, Spinner, Portal, Popover, PopoverTrigger, PopoverContent,
  PopoverBody, PopoverArrow, MenuDivider
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { updateTask } from "../../../slices/tasks";
import TaskDataService from "../../../services/taskservice";
import { FaArrowLeft, FaSave, FaEye, FaEyeSlash, FaShare, FaDownload, FaFilePdf, FaFileWord, FaFileAlt, FaTags, FaFolder, FaEllipsisH } from "react-icons/fa";
import { BiCommentDetail } from "react-icons/bi";
import { BsGearFill, BsThreeDots } from "react-icons/bs";
import { FiSearch, FiPlus, FiMoreHorizontal } from "react-icons/fi";
import RichTextEditor from '../editor/RichTextEditor';
import { formatLocalDateTime } from "../../../utils/locale";
import ConfigService from "../../../utils/config";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Function to extract text from Lexical JSON
const extractTextFromLexicalJSON = (jsonString) => {
  try {
    const content = JSON.parse(jsonString);
    let text = '';
    
    const processNode = (node) => {
      if (node.text) {
        text += node.text;
      }
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    if (content.root && content.root.children) {
      content.root.children.forEach(processNode);
    }
    
    return text;
  } catch (error) {
    console.error('Error parsing Lexical JSON:', error);
    return '';
  }
};

// Note templates
const NOTE_TEMPLATES = [
  { id: 'meeting', name: 'Meeting Notes', description: 'Template for meeting notes' },
  { id: 'todo', name: 'To-Do List', description: 'Template for task lists' },
  { id: 'project', name: 'Project Notes', description: 'Template for project documentation' },
  { id: 'code', name: 'Code Snippet', description: 'Template for code documentation' },
];

// Available categories
const AVAILABLE_CATEGORIES = [
  'Work', 'Personal', 'Study', 'Project', 'Ideas', 'Code', 'Documentation'
];

export default function EditNoteDrawer(props) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentTask, setCurrentTask } = props;
  const [size] = useState('xl');
  const initialRef = React.useRef(null);
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const { isOpen, onOpen, onClose } = props.disclosures;
  const toast = useToast();
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');

  const getTask = task_id => {
    setIsLoading(true);
    TaskDataService.get(task_id)
      .then(response => {
        if (response && response.data) {
          setCurrentTask(response.data);
        }
      })
      .catch(e => {
        console.error('Error loading note:', e);
        setMessage("Error loading note");
        toast({
          title: "Error",
          description: "Failed to load note",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && currentTask && currentTask.task_id) {
      getTask(currentTask.task_id);
    }
  }, [isOpen, currentTask?.task_id]);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const updateContent = () => {
    setIsLoading(true);
    setMessage("Saving ...");
    
    // Get workspace ID and user ID from config
    const workspace_id = ConfigService.getDefaultWorkspace().workspace_id;
    const user_id = ConfigService.getUserId();
    
    // Include workspace_id, user_id and default priority in the payload
    const payload = {
      ...currentTask,
      workspace_id: workspace_id,
      user_id: user_id,
      priority: "Medium" // Default priority for notes
    };

    dispatch(updateTask({ task_id: currentTask.task_id, data: payload }))
      .unwrap()
      .then(response => {
        setMessage("Saved !");
        toast({
          title: "Success",
          description: "Note saved successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setIsLoading(false);
        setTimeout(() => setMessage(""), 1000);
      })
      .catch(e => {
        setMessage("Error in Saving !");
        toast({
          title: "Error",
          description: "Failed to save note",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        setTimeout(() => setMessage(""), 2000);
      });
  };

  const handlePublishToggle = () => {
    const updatedTask = {
      ...currentTask,
      published: !currentTask.published
    };
    setCurrentTask(updatedTask);
    updateContent();
  };

  const handleExport = async (format) => {
    if (format === 'pdf') {
      try {
        // Create a temporary div to render the content
        const tempDiv = document.createElement('div');
        tempDiv.style.padding = '20px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.color = 'black';
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = currentTask.title || 'Untitled';
        title.style.fontSize = '24px';
        title.style.marginBottom = '20px';
        tempDiv.appendChild(title);
        
        // Add content
        const content = document.createElement('div');
        content.innerHTML = extractTextFromLexicalJSON(currentTask.description);
        content.style.fontSize = '14px';
        tempDiv.appendChild(content);
        
        // Add metadata
        const metadata = document.createElement('div');
        metadata.style.marginTop = '20px';
        metadata.style.fontSize = '12px';
        metadata.style.color = '#666';
        metadata.innerHTML = `
          <p>Created: ${formatLocalDateTime(currentTask.created_at)}</p>
          <p>Updated: ${formatLocalDateTime(currentTask.updated_at)}</p>
          ${currentTask.tags?.length ? `<p>Tags: ${currentTask.tags.join(', ')}</p>` : ''}
        `;
        tempDiv.appendChild(metadata);
        
        // Add to document temporarily
        document.body.appendChild(tempDiv);
        
        // Convert to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Save the PDF
        pdf.save(`${currentTask.title || 'note'}.pdf`);
        
        // Clean up
        document.body.removeChild(tempDiv);
        
        toast({
          title: "Success",
          description: "Note exported as PDF successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error exporting to PDF:', error);
        toast({
          title: "Error",
          description: "Failed to export note as PDF",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !currentTask.tags?.includes(newTag.trim())) {
      const updatedTags = [...(currentTask.tags || []), newTag.trim()];
      setCurrentTask({ ...currentTask, tags: updatedTags });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = currentTask.tags?.filter(tag => tag !== tagToRemove);
    setCurrentTask({ ...currentTask, tags: updatedTags });
  };

  const handleAddCategory = () => {
    if (newCategory && !currentTask.category) {
      setCurrentTask({ ...currentTask, category: newCategory });
      setNewCategory("");
    }
  };

  const handleApplyTemplate = (template) => {
    let initialContent = "";
    switch (template.id) {
      case 'meeting':
        initialContent = {
          root: {
            children: [
              {
                type: "heading",
                children: [{ text: "Meeting Notes" }],
                tag: "h1"
              },
              {
                type: "paragraph",
                children: [
                  { text: "Date: " },
                  { text: new Date().toLocaleDateString(), bold: true }
                ]
              },
              {
                type: "paragraph",
                children: [{ text: "Attendees:" }]
              },
              {
                type: "list",
                children: [{ text: "Add attendee names here" }],
                listType: "bullet"
              },
              {
                type: "paragraph",
                children: [{ text: "Agenda:" }]
              },
              {
                type: "list",
                children: [{ text: "Add agenda items here" }],
                listType: "bullet"
              }
            ]
          }
        };
        break;
      case 'todo':
        initialContent = {
          root: {
            children: [
              {
                type: "heading",
                children: [{ text: "To-Do List" }],
                tag: "h1"
              },
              {
                type: "list",
                children: [{ text: "Add tasks here" }],
                listType: "check"
              }
            ]
          }
        };
        break;
      case 'code':
        initialContent = {
          root: {
            children: [
              {
                type: "heading",
                children: [{ text: "Code Documentation" }],
                tag: "h1"
              },
              {
                type: "paragraph",
                children: [{ text: "Description:" }]
              },
              {
                type: "code",
                children: [{ text: "// Add your code here" }],
                language: "javascript"
              }
            ]
          }
        };
        break;
      default:
        initialContent = {
          root: {
            children: [
              {
                type: "paragraph",
                children: [{ text: "Start writing..." }]
              }
            ]
          }
        };
    }
    setCurrentTask({
      ...currentTask,
      description: JSON.stringify(initialContent)
    });
  };

  return (
    <Drawer 
      onClose={onClose} 
      isOpen={isOpen} 
      size={size}
      placement="right"
    >
      <DrawerOverlay backdropFilter="blur(4px)" />
      <DrawerContent 
        bg={bgColor} 
        borderLeft="1px" 
        borderColor={borderColor}
        boxShadow="xl"
      >
        <DrawerCloseButton top={4} right={4} zIndex={2} />
        
        {/* Header */}
        <DrawerHeader 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          py={4}
          px={6}
        >
          <Flex justify="space-between" align="center" position="relative">
            <HStack spacing={4}>
              <IconButton
                icon={<Icon as={FaArrowLeft} />}
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Back"
              />
              <Badge 
                colorScheme={currentTask?.published ? "green" : "gray"}
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                {currentTask?.published ? "Published" : "Draft"}
              </Badge>
            </HStack>
            <HStack spacing={2} position="absolute" right="4" zIndex={1}>
              <Tooltip label="Comments" hasArrow>
                <IconButton
                  icon={<Icon as={BiCommentDetail} />}
                  variant="ghost"
                  size="sm"
                  aria-label="Comments"
                />
              </Tooltip>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<Icon as={FiMoreHorizontal} />}
                  variant="ghost"
                  size="sm"
                  aria-label="More options"
                />
                <MenuList shadow="lg" py={2}>
                  <MenuItem 
                    icon={<Icon as={currentTask?.published ? FaEyeSlash : FaEye} />}
                    onClick={handlePublishToggle}
                    py={2}
                  >
                    {currentTask?.published ? "Unpublish" : "Publish"}
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaShare} />} py={2}>
                    Share
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem 
                    icon={<Icon as={FaFilePdf} />} 
                    py={2}
                    onClick={() => handleExport('pdf')}
                  >
                    Export as PDF
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaFileWord} />} py={2}>
                    Export as Word
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaFileAlt} />} py={2}>
                    Export as Markdown
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </DrawerHeader>

        {/* Body */}
        <DrawerBody px={6} py={4}>
          <VStack spacing={6} align="stretch">
            {/* Title Input */}
            <FormControl>
              <Input
                ref={initialRef}
                placeholder="Untitled"
                id="title"
                required
                value={currentTask?.title || ''}
                onChange={handleInputChange}
                name="title"
                size="lg"
                fontSize="2xl"
                fontWeight="bold"
                variant="unstyled"
                px={0}
                _placeholder={{ color: mutedColor }}
                mb={2}
              />
              <Text fontSize="sm" color={mutedColor}>
                Last updated: {formatLocalDateTime(currentTask?.updated_at)}
              </Text>
            </FormControl>

            <Divider />

            {/* Metadata Section */}
            <VStack spacing={4} align="stretch">
              {/* Category */}
              <HStack spacing={3}>
                <Icon as={FaFolder} color={mutedColor} />
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<Icon as={FiPlus} />}
                      color={mutedColor}
                      _hover={{ bg: hoverBg }}
                    >
                      {currentTask?.category || "Add category"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent width="200px" shadow="lg">
                    <PopoverArrow />
                    <PopoverBody p={2}>
                      <VStack align="stretch" spacing={1}>
                        {AVAILABLE_CATEGORIES.map(category => (
                          <Button
                            key={category}
                            size="sm"
                            variant="ghost"
                            justifyContent="flex-start"
                            onClick={() => {
                              setNewCategory(category);
                              handleAddCategory();
                            }}
                            _hover={{ bg: hoverBg }}
                          >
                            {category}
                          </Button>
                        ))}
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </HStack>

              {/* Tags */}
              <HStack spacing={3} align="flex-start">
                <Icon as={FaTags} color={mutedColor} mt={2} />
                <VStack align="stretch" spacing={2} flex={1}>
                  <Wrap spacing={2}>
                    {currentTask?.tags?.map((tag) => (
                      <Tag
                        key={tag}
                        size="md"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme="blue"
                      >
                        <TagLabel>{tag}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                      </Tag>
                    ))}
                    <InputGroup size="sm" width="150px" display="inline-flex">
                      <Input
                        placeholder="Add tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        borderRadius="full"
                        pl={8}
                      />
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FiSearch} color={mutedColor} />
                      </InputLeftElement>
                    </InputGroup>
                  </Wrap>
                </VStack>
              </HStack>
            </VStack>

            <Divider />

            {/* Templates */}
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                Templates
              </Text>
              <Wrap spacing={2}>
                {NOTE_TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyTemplate(template)}
                    _hover={{ bg: hoverBg }}
                  >
                    {template.name}
                  </Button>
                ))}
              </Wrap>
            </VStack>

            <Divider />

            {/* Editor */}
            <Box flex={1}>
              <RichTextEditor
                value={currentTask?.description || ''}
                onChange={(newContent) => {
                  setCurrentTask(prev => ({
                    ...prev,
                    description: newContent
                  }));
                }}
              />
            </Box>
          </VStack>
        </DrawerBody>

        {/* Footer */}
        <DrawerFooter 
          borderTopWidth="1px" 
          borderColor={borderColor}
          py={4}
          px={6}
        >
          <Flex w="100%" justify="space-between" align="center">
            <Box color={isLoading ? "blue.500" : mutedColor}>
              {isLoading ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm">{message}</Text>
                </HStack>
              ) : (
                <Text fontSize="sm">{message}</Text>
              )}
            </Box>
            <HStack spacing={3}>
              <Button
                variant="ghost"
                onClick={onClose}
                size="md"
              >
                Close
              </Button>
              <Button
                colorScheme="blue"
                onClick={updateContent}
                isLoading={isLoading}
                leftIcon={<Icon as={FaSave} />}
                size="md"
              >
                Save
              </Button>
            </HStack>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}