import React, { useState, useEffect } from "react";
import {
  Flex, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Box, Button, FormControl,
  Input, Menu, MenuButton, MenuItem, MenuList, Icon, Text, useColorModeValue,
  Badge, Tooltip, useToast, IconButton, VStack, HStack, Divider, Tag,
  TagLabel, TagCloseButton, Wrap, Select, InputGroup, InputLeftElement,
  InputRightElement, Spinner
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { updateTask } from "../../../slices/tasks";
import TaskDataService from "../../../services/taskservice";
import { FaArrowLeft, FaSave, FaEye, FaEyeSlash, FaShare, FaDownload, FaFilePdf, FaFileWord, FaFileAlt, FaTags, FaFolder } from "react-icons/fa";
import { BiCommentDetail } from "react-icons/bi";
import { BsGearFill } from "react-icons/bs";
import { FiSearch, FiPlus } from "react-icons/fi";
import FtTextEditor from "../sections/FtTextEditor";
import { formatLocalDateTime } from "../../../utils/locale";
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

  const handleExport = (format) => {
    toast({
      title: "Export",
      description: `Exporting to ${format}...`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
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
    <Drawer onClose={onClose} isOpen={isOpen} size={size}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" pb={2}>
          <Flex justifyContent="space-between" alignItems="center" pr={10}>
            <Button onClick={onClose} leftIcon={<Icon as={FaArrowLeft} />} variant="ghost" size="sm">
              Back
            </Button>
            <Flex gap={2} alignItems="center">
              <Tooltip label="Comments">
                <IconButton
                  icon={<Icon as={BiCommentDetail} />}
                  variant="ghost"
                  size="sm"
                  aria-label="Comments"
                />
              </Tooltip>
              <Menu>
                <MenuButton as={IconButton} icon={<Icon as={BsGearFill} />} variant="ghost" size="sm" />
                <MenuList>
                  <MenuItem 
                    icon={<Icon as={currentTask?.published ? FaEyeSlash : FaEye} />} 
                    onClick={handlePublishToggle}
                  >
                    {currentTask?.published ? "Unpublish" : "Publish"}
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaShare} />}>Share</MenuItem>
                  <Menu>
                    <MenuButton as={MenuItem} icon={<Icon as={FaDownload} />}>
                      Export
                    </MenuButton>
                    <MenuList>
                      <MenuItem icon={<Icon as={FaFilePdf} />} onClick={() => handleExport('PDF')}>PDF</MenuItem>
                      <MenuItem icon={<Icon as={FaFileWord} />} onClick={() => handleExport('Word')}>Word</MenuItem>
                      <MenuItem icon={<Icon as={FaFileAlt} />} onClick={() => handleExport('Markdown')}>Markdown</MenuItem>
                    </MenuList>
                  </Menu>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
        </DrawerHeader>

        <DrawerBody>
          <Box>
            <FormControl mb={4}>
              <Input
                ref={initialRef}
                placeholder="Title"
                id="title"
                required
                value={currentTask?.title || ''}
                onChange={handleInputChange}
                name="title"
                size="lg"
                fontWeight="bold"
                borderColor="gray.300"
                bg="gray.50"
                mb={2}
              />
              <Flex align="center" gap={2} mb={4}>
                <Badge colorScheme={currentTask?.published ? "green" : "gray"}>
                  {currentTask?.published ? "Published" : "Draft"}
                </Badge>
                <Text fontSize="sm" color="gray.500">
                  Last updated: {formatLocalDateTime(currentTask?.updated_at)}
                </Text>
              </Flex>

              {/* Categories */}
              <HStack mb={4}>
                <Icon as={FaFolder} color="gray.500" />
                <Select
                  placeholder="Select category"
                  value={currentTask?.category || ''}
                  onChange={(e) => setNewCategory(e.target.value)}
                  size="sm"
                  width="200px"
                >
                  {AVAILABLE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
                {newCategory && (
                  <Button
                    size="sm"
                    leftIcon={<Icon as={FiPlus} />}
                    onClick={handleAddCategory}
                  >
                    Add
                  </Button>
                )}
              </HStack>

              {/* Tags */}
              <VStack align="start" mb={4}>
                <HStack>
                  <Icon as={FaTags} color="gray.500" />
                  <Text fontSize="sm" fontWeight="medium">Tags</Text>
                </HStack>
                <Wrap>
                  {currentTask?.tags?.map((tag) => (
                    <Tag
                      key={tag}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme="blue"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                    </Tag>
                  ))}
                </Wrap>
                <InputGroup size="sm" width="200px">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      icon={<Icon as={FiPlus} />}
                      onClick={handleAddTag}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </VStack>

              {/* Templates */}
              <VStack align="start" mb={4}>
                <Text fontSize="sm" fontWeight="medium">Templates</Text>
                <Wrap>
                  {NOTE_TEMPLATES.map(template => (
                    <Button
                      key={template.id}
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </Wrap>
              </VStack>
            </FormControl>
            <FormControl>
              {currentTask && (
                <FtTextEditor 
                  currentTask={currentTask} 
                  setCurrentTask={setCurrentTask} 
                />
              )}
            </FormControl>
          </Box>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" pt={2}>
          <Flex w="100%" justify="space-between" align="center">
            <Box color={isLoading ? "blue.500" : "gray.600"} fontSize="sm">
              {isLoading && (
                <>
                  <Spinner size="sm" mr={2} />
                  {message}
                </>
              )}
              {!isLoading && message}
            </Box>
            <Flex gap={2}>
              <Button
                onClick={onClose}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={updateContent}
                leftIcon={<Icon as={FaSave} />}
                colorScheme="blue"
                isLoading={isLoading}
              >
                Save
              </Button>
            </Flex>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}