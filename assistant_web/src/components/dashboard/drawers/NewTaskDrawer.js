import React, { useState } from "react";
import {
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Box, Button, FormControl,
  Input, Menu, MenuButton, MenuItem, MenuList, Icon, Text, useColorModeValue,
  Badge, Tooltip, useToast, IconButton, VStack, HStack, Divider, Tag,
  TagLabel, TagCloseButton, Wrap, Select, InputGroup, InputLeftElement,
  InputRightElement, Spinner, Flex, Popover, PopoverTrigger, PopoverContent,
  PopoverBody, PopoverArrow, Portal, MenuDivider, FormLabel, AvatarGroup,
  Avatar, Progress
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { createTask } from "../../../slices/tasks";
import { 
  FaArrowLeft, FaSave, FaCalendarAlt, FaTag, FaClipboardList, 
  FaUser, FaPaperclip, FaPlus, FaClock, FaUsers, FaHashtag,
  FaShare, FaEllipsisH, FaCheckCircle, FaRegCircle
} from "react-icons/fa";
import { FiMoreHorizontal, FiCheck, FiClock } from "react-icons/fi";
import RichTextEditor from '../editor/RichTextEditor';
import ConfigService from "../../../utils/config";

// Task templates
const TASK_TEMPLATES = [
  { id: 'bug', name: 'Bug Report', description: 'Template for reporting bugs' },
  { id: 'feature', name: 'Feature Request', description: 'Template for feature requests' },
  { id: 'research', name: 'Research Task', description: 'Template for research tasks' },
  { id: 'review', name: 'Code Review', description: 'Template for code reviews' },
];

// Available categories
const AVAILABLE_CATEGORIES = [
  'Development', 'Design', 'Testing', 'Documentation', 'Research', 'Planning', 'Review'
];

// Priority levels with colors
const PRIORITY_LEVELS = [
  { value: 'Low', color: 'green' },
  { value: 'Medium', color: 'yellow' },
  { value: 'High', color: 'orange' },
  { value: 'Urgent', color: 'red' }
];

// Status configuration
const STATUS_CONFIG = {
  todo: { color: "gray", label: "To Do" },
  in_progress: { color: "blue", label: "In Progress" },
  done: { color: "green", label: "Done" }
};

// Sample users for demonstration
const sampleUsers = [
  { id: 1, name: "John Doe", avatar: "https://bit.ly/dan-abramov" },
  { id: 2, name: "Jane Smith", avatar: "https://bit.ly/ryan-florence" },
  { id: 3, name: "Mike Johnson", avatar: "https://bit.ly/kent-c-dodds" },
];

export default function NewTaskDrawer(props) {
  const initialTaskState = {
    task_id: null,
    title: "",
    description: "",
    priority: "Medium",
    status: "todo",
    due_on: "",
    assignees: [],
    labels: [],
    task_type: 'task'
  };

  const [size] = useState('xl');
  const { isOpen, onClose } = props.disclosures;
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const dispatch = useDispatch();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const labelColor = useColorModeValue("gray.700", "gray.300");

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const handleApplyTemplate = (template) => {
    let initialContent = "";
    switch (template.id) {
      case 'bug':
        initialContent = {
          root: {
            children: [
              {
                type: "heading",
                children: [{ text: "Bug Report" }],
                tag: "h1"
              },
              {
                type: "paragraph",
                children: [{ text: "Description of the bug:" }]
              },
              {
                type: "list",
                children: [
                  { text: "Expected behavior:" },
                  { text: "Current behavior:" },
                  { text: "Steps to reproduce:" }
                ],
                listType: "bullet"
              }
            ]
          }
        };
        break;
      case 'feature':
        initialContent = {
          root: {
            children: [
              {
                type: "heading",
                children: [{ text: "Feature Request" }],
                tag: "h1"
              },
              {
                type: "paragraph",
                children: [{ text: "Feature description:" }]
              },
              {
                type: "list",
                children: [
                  { text: "User story:" },
                  { text: "Acceptance criteria:" },
                  { text: "Technical requirements:" }
                ],
                listType: "bullet"
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
                children: [{ text: "Describe your task here..." }]
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

  const saveTask = async () => {
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
      await dispatch(createTask(payload)).unwrap();
      toast({
        title: "Success",
        description: "Task created successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
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
                colorScheme={STATUS_CONFIG[currentTask?.status || 'todo'].color}
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                {STATUS_CONFIG[currentTask?.status || 'todo'].label}
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
                  <MenuItem icon={<Icon as={FaShare} />} py={2}>
                    Share
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaUsers} />} py={2}>
                    Assign
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<Icon as={TASK_TEMPLATES[0].icon} />} py={2}>
                    Apply Template
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
                placeholder="Task title"
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

            {/* Task Metadata */}
            <VStack spacing={4} align="stretch">
              {/* Status and Priority */}
              <HStack spacing={6}>
                <FormControl>
                  <HStack spacing={3}>
                    <Icon as={FaClipboardList} color={mutedColor} />
                    <Select
                      name="status"
                      value={currentTask?.status || ''}
                      onChange={handleInputChange}
                      size="sm"
                      width="150px"
                      variant="filled"
                      bg={inputBg}
                    >
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                </FormControl>

                <FormControl>
                  <HStack spacing={3}>
                    <Icon as={FaTag} color={mutedColor} />
                    <Select
                      name="priority"
                      value={currentTask?.priority || ''}
                      onChange={handleInputChange}
                      size="sm"
                      width="150px"
                      variant="filled"
                      bg={inputBg}
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.value}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                </FormControl>
              </HStack>

              {/* Due Date */}
              <FormControl>
                <HStack spacing={3}>
                  <Icon as={FaCalendarAlt} color={mutedColor} />
                  <Input
                    type="datetime-local"
                    name="due_on"
                    value={currentTask?.due_on || ''}
                    onChange={handleInputChange}
                    size="sm"
                    width="auto"
                    variant="filled"
                    bg={inputBg}
                  />
                </HStack>
              </FormControl>

              {/* Assignees */}
              <FormControl>
                <HStack spacing={3} align="flex-start">
                  <Icon as={FaUser} color={mutedColor} mt={2} />
                  <VStack align="stretch" spacing={2} flex={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Assignees
                      </Text>
                      <IconButton
                        icon={<Icon as={FaPlus} />}
                        size="xs"
                        variant="ghost"
                        aria-label="Add assignee"
                      />
                    </HStack>
                    <AvatarGroup size="sm" max={5}>
                      {currentTask?.assignees?.map(user => (
                        <Avatar
                          key={user.id}
                          name={user.name}
                          src={user.avatar}
                          size="sm"
                        />
                      ))}
                    </AvatarGroup>
                  </VStack>
                </HStack>
              </FormControl>

              {/* Labels */}
              <FormControl>
                <HStack spacing={3} align="flex-start">
                  <Icon as={FaHashtag} color={mutedColor} mt={2} />
                  <VStack align="stretch" spacing={2} flex={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Labels
                      </Text>
                      <IconButton
                        icon={<Icon as={FaPlus} />}
                        size="xs"
                        variant="ghost"
                        aria-label="Add label"
                      />
                    </HStack>
                    <Wrap>
                      {currentTask?.labels?.map(label => (
                        <Tag
                          key={label}
                          size="sm"
                          borderRadius="full"
                          variant="subtle"
                          colorScheme="blue"
                        >
                          <TagLabel>{label}</TagLabel>
                          <TagCloseButton />
                        </Tag>
                      ))}
                    </Wrap>
                  </VStack>
                </HStack>
              </FormControl>
            </VStack>

            <Divider />

            {/* Templates */}
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                Templates
              </Text>
              <Wrap spacing={2}>
                {TASK_TEMPLATES.map(template => (
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

            {/* Description */}
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Description
              </Text>
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
                    Creating task...
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
                onClick={saveTask}
                isLoading={isLoading}
                leftIcon={<Icon as={FaSave} />}
                size="md"
              >
                Create Task
              </Button>
            </HStack>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}