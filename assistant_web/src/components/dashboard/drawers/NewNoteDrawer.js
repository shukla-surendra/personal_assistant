import React, { useState } from "react";
import {
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Box, Button, FormControl,
  Input, Menu, MenuButton, MenuItem, MenuList, Icon, Text, useColorModeValue,
  Badge, Tooltip, useToast, IconButton, VStack, HStack, Divider, Tag,
  TagLabel, TagCloseButton, Wrap, Select, InputGroup, InputLeftElement,
  InputRightElement, Spinner, Flex, Popover, PopoverTrigger, PopoverContent,
  PopoverBody, PopoverArrow, Portal, MenuDivider
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { createNotes } from "../../../slices/tasks";
import { 
  FaArrowLeft, FaSave, FaEye, FaEyeSlash, FaShare, FaDownload, 
  FaFilePdf, FaFileWord, FaFileAlt, FaTags, FaFolder, FaEllipsisH 
} from "react-icons/fa";
import { FiMoreHorizontal, FiPlus, FiSearch } from "react-icons/fi";
import RichTextEditor from '../editor/RichTextEditor';
import ConfigService from "../../../utils/config";

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

export default function NewNoteDrawer(props) {
  const initialTaskState = {
    task_id: null,
    title: "",
    description: "",
    priority: "Medium",
    task_type: 'note',
    published: false,
    tags: [],
    category: ""
  };

  const [size] = useState('xl');
  const { isOpen, onClose } = props.disclosures;
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const dispatch = useDispatch();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const handlePublishToggle = () => {
    setCurrentTask(prev => ({
      ...prev,
      published: !prev.published
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !currentTask.tags?.includes(newTag.trim())) {
      setCurrentTask(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setCurrentTask(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
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
    setCurrentTask(prev => ({
      ...prev,
      description: JSON.stringify(initialContent)
    }));
  };

  const saveNote = async () => {
    setIsLoading(true);
    
    // Get workspace ID and user ID from config
    const workspace_id = ConfigService.getDefaultWorkspace().workspace_id;
    const user_id = ConfigService.getUserId();
    
    const payload = {
      ...currentTask,
      workspace_id,
      user_id
    };

    try {
      await dispatch(createNotes(payload)).unwrap();
      toast({
        title: "Success",
        description: "Note created successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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
        <DrawerCloseButton top={4} right={4} />
        
        {/* Header */}
        <DrawerHeader 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          py={4}
          px={6}
        >
          <Flex justify="space-between" align="center">
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
            <HStack spacing={2}>
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
                  <MenuItem icon={<Icon as={FaFilePdf} />} py={2}>
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
                placeholder="Untitled"
                name="title"
                value={currentTask?.title || ''}
                onChange={handleInputChange}
                size="lg"
                fontSize="2xl"
                fontWeight="bold"
                variant="unstyled"
                px={0}
                _placeholder={{ color: mutedColor }}
              />
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
                              setCurrentTask(prev => ({
                                ...prev,
                                category
                              }));
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
                        size="sm"
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
            <Box>
              {isLoading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color={mutedColor}>
                    Creating note...
                  </Text>
                </HStack>
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
                onClick={saveNote}
                isLoading={isLoading}
                leftIcon={<Icon as={FaSave} />}
                size="md"
              >
                Create Note
              </Button>
            </HStack>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
